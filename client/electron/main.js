const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const xmlrpc = require('xmlrpc');
const axios = require('axios');

// Cargar .env de forma segura
try {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
    console.log('No se pudo cargar .env', e);
}

// Configuración Odoo (Intenta leer del .env, si no usa valores por defecto o lanza error)
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;

// Helpers para XML-RPC
// Parsear URL para extraer host limpio
const parsedUrl = new URL(ODOO_URL);
const host = parsedUrl.hostname;

// Cliente XML-RPC necesita configuración segura (https)
const clientOptions = {
    host: host,
    port: 443,
    path: '/xmlrpc/2/common',
    rejectUnauthorized: false
};

// Crear Clientes
const commonClient = xmlrpc.createSecureClient({ ...clientOptions, path: '/xmlrpc/2/common' });
const objectClient = xmlrpc.createSecureClient({ ...clientOptions, path: '/xmlrpc/2/object' });

// --- LÓGICA DE NEGOCIO (Portado de Python a JS) ---

/**
 * Promisify para llamadas XML-RPC (hacerlas async/await)
 */
const odooCall = (client, method, params) => {
    return new Promise((resolve, reject) => {
        client.methodCall(method, params, (error, value) => {
            if (error) reject(error);
            else resolve(value);
        });
    });
};

// 1. LOGIN
ipcMain.handle('auth-login', async (event, { username, password }) => {
    try {
        console.log(`Intentando login para: ${username} en DB: ${ODOO_DB}`);
        const uid = await odooCall(commonClient, 'authenticate', [ODOO_DB, username, password, {}]);

        if (uid) {
            return { success: true, uid, username };
        } else {
            return { success: false, message: 'Credenciales inválidas' };
        }
    } catch (error) {
        console.error('Error Login:', error);
        return { success: false, message: `Error de conexión: ${error.message}` };
    }
});

// 2. OBTENER LOTES DE PAGOS
ipcMain.handle('get-lotes', async (event, { uid, password }) => {
    try {
        // Search
        const lotIds = await odooCall(objectClient, 'execute_kw', [
            ODOO_DB, uid, password,
            'hr.payslip.run', 'search',
            [[]]
        ]);

        // Read
        const lots = await odooCall(objectClient, 'execute_kw', [
            ODOO_DB, uid, password,
            'hr.payslip.run', 'read',
            [lotIds],
            { fields: ['id', 'name', 'date_start', 'company_id'] }
        ]);

        // Ordenamiento (JS sort)
        lots.sort((a, b) => {
            // Fecha descendente
            const dateA = a.date_start || '';
            const dateB = b.date_start || '';
            return dateB.localeCompare(dateA);
        });

        return lots;
    } catch (error) {
        console.error('Error Get Lotes:', error);
        throw error;
    }
});

// 3. IMPRIMIR (Descargar PDF)
ipcMain.handle('print-colillas', async (event, { uid, password, lotId, username }) => {
    try {
        console.log(`Generando reporte para lote ${lotId}...`);

        // --- A. Obtener detalles del lote para decidir reporte ---
        const payslipIds = await odooCall(objectClient, 'execute_kw', [
            ODOO_DB, uid, password, 'hr.payslip', 'search', [[['payslip_run_id', '=', lotId]]]
        ]);

        if (!payslipIds || payslipIds.length === 0) {
            return { success: false, message: 'No hay colillas en este lote' };
        }

        // Leer estructuras para ver si es aguinaldo
        const payslips = await odooCall(objectClient, 'execute_kw', [
            ODOO_DB, uid, password, 'hr.payslip', 'read', [payslipIds],
            { fields: ['struct_id'] }
        ]);

        const isAguinaldo = payslips.some(p => p.struct_id && p.struct_id[1] && p.struct_id[1].includes('Aguinaldo'));
        const reportXmlId = isAguinaldo
            ? 'l10n_ni_formatos_dgi.report_boleta_aguinaldo_template'
            : 'l10n_ni_formatos_dgi.report_boleta_pago_template';

        console.log(`Usando reporte: ${reportXmlId}`);

        // --- B. Buscar el ID Técnico del Reporte ---
        const reports = await odooCall(objectClient, 'execute_kw', [
            ODOO_DB, uid, password, 'ir.actions.report', 'search_read',
            [[['model', '=', 'hr.payslip']]],
            { fields: ['id', 'report_name', 'name'] }
        ]);

        let targetReport = reports.find(r =>
            (isAguinaldo && r.report_name.toLowerCase().includes('aguinaldo')) ||
            (!isAguinaldo && r.report_name.toLowerCase().includes('pago'))
        );

        if (!targetReport && reports.length > 0) targetReport = reports[0]; // Fallback
        if (!targetReport) return { success: false, message: 'No se encontró definición de reporte' };

        const reportName = targetReport.report_name;

        // --- C. Descarga HTTP con Sesión (Axios) ---
        // 1. Autenticar sesión HTTP
        const loginUrl = `${ODOO_URL}/web/session/authenticate`;
        const loginResp = await axios.post(loginUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: { db: ODOO_DB, login: username, password: password }
        });

        if (loginResp.data.error) {
            return { success: false, message: 'Error auth HTTP Odoo' };
        }

        // Extraer Session ID de las cookies
        const cookies = loginResp.headers['set-cookie'];
        if (!cookies) return { success: false, message: 'No se obtuvo cookie de sesión' };

        const sessionCookie = cookies.find(c => c.startsWith('session_id'));

        // 2. Descargar PDF
        const pdfUrl = `${ODOO_URL}/report/pdf/${reportName}/${payslipIds.join(',')}`;

        const pdfResp = await axios.get(pdfUrl, {
            responseType: 'arraybuffer', // Importante para binarios
            headers: {
                Cookie: sessionCookie
            }
        });

        // Convertir a Base64
        const pdfBase64 = Buffer.from(pdfResp.data).toString('base64');
        return { success: true, pdf_data: pdfBase64 };

    } catch (error) {
        console.error('Error Print:', error);
        return { success: false, message: error.message };
    }
});


// --- CONFIGURACIÓN DE VENTANA ---

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        autoHideMenuBar: true,
        // icon: path.join(__dirname, '../public/vite.svg') // Comentado por ahora
    });

    if (!app.isPackaged) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
