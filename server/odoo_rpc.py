import os
from dotenv import load_dotenv
import xmlrpc.client
import base64
import requests

load_dotenv()

ODOO_URL = os.getenv("ODOO_URL")
ODOO_DB = os.getenv("ODOO_DB")

# Servicios de Odoo
common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

def authenticate(username: str, password: str) -> dict:
    """Autenticar usuario con Odoo"""
    try:
        uid = common.authenticate(ODOO_DB, username, password, {})
        if uid:
            return {"success": True, "uid": uid, "username": username}
        else:
            return {"success": False, "message": "Credenciales inválidas"}
    except Exception as e:
        print(f"Error de conexión a Odoo: {e}")
        return {"success": False, "message": "Error de conexión a Odoo"}

def get_payslip_runs(uid: int, password: str) -> list:
    """Obtener todos los lotes de nómina"""
    try:
        lot_ids = models.execute_kw(
            ODOO_DB, uid, password, 'hr.payslip.run', 'search', [[]]
        )
        lots = models.execute_kw(
            ODOO_DB, uid, password, 'hr.payslip.run', 'read', [lot_ids],
            {'fields': ['id', 'name', 'date_start', 'company_id']}
        )
        # Ordenar por fecha descendente primero
        lots.sort(key=lambda x: x.get('date_start', '') or '', reverse=True)
        # Luego ordenar por nombre de compañía ascendente (stable sort)
        lots.sort(key=lambda x: x.get('company_id', [0, ''])[1] if x.get('company_id') else '')
        return lots
    except Exception as e:
        print(f"Error al obtener los lotes: {e}")
        return []

def get_payslip_details(uid: int, password: str, lot_id: int) -> list:
    """Obtener detalles de las colillas de un lote específico"""
    try:
        # 1. Obtener IDs de colillas en el lote
        payslip_ids = models.execute_kw(
            ODOO_DB, uid, password, 'hr.payslip', 'search', [[('payslip_run_id', '=', lot_id)]]
        )
        
        if not payslip_ids:
            return []

        # 2. Leer información de las colillas
        payslips = models.execute_kw(
            ODOO_DB, uid, password, 'hr.payslip', 'read', [payslip_ids],
            {'fields': ['id', 'name', 'employee_id', 'date_from', 'date_to', 'line_ids', 'company_id', 'struct_id']}
        )

        # 3. Recopilar todos los IDs de líneas para obtenerlos en batch
        all_line_ids = []
        for p in payslips:
            all_line_ids.extend(p['line_ids'])
            
        # 4. Leer líneas
        lines_data = models.execute_kw(
            ODOO_DB, uid, password, 'hr.payslip.line', 'read', [all_line_ids],
            {'fields': ['id', 'name', 'code', 'total', 'quantity', 'slip_id']}
        )
        
        # Agrupar líneas por slip_id
        lines_by_slip = {}
        for line in lines_data:
            slip_id = line['slip_id'][0]
            if slip_id not in lines_by_slip:
                lines_by_slip[slip_id] = []
            lines_by_slip[slip_id].append(line)

        # 5. Ensamblar estructura final
        result = []
        for p in payslips:
            slip_lines = lines_by_slip.get(p['id'], [])
            
            # Calcular salario neto
            net_wage = sum(l['total'] for l in slip_lines if l['code'] == 'NET')
            
            result.append({
                'id': p['id'],
                'employee_name': p['employee_id'][1] if p['employee_id'] else 'Unknown',
                'company_name': p['company_id'][1] if p['company_id'] else '',
                'struct_name': p['struct_id'][1] if p['struct_id'] else '',
                'date_from': p['date_from'],
                'date_to': p['date_to'],
                'lines': slip_lines,
                'net_wage': net_wage
            })
            
        return result

    except Exception as e:
        print(f"Error al obtener detalles de nómina: {e}")
        return []

def render_report_pdf(uid: int, password: str, report_xml_id: str, record_ids: list, username: str = None) -> dict:
    """
    Renderizar un reporte QWeb de Odoo como PDF usando la API HTTP.
    """
    try:
        # Buscar el reporte para hr.payslip
        report_actions = models.execute_kw(
            ODOO_DB, uid, password, 'ir.actions.report', 'search_read',
            [[('model', '=', 'hr.payslip')]],
            {'fields': ['id', 'report_name', 'name']}
        )
        
        if not report_actions:
            return {"success": False, "message": "No se encontraron reportes para hr.payslip"}
        
        # Intentar encontrar el reporte que coincida con el patrón del XML ID
        target_report = None
        for report in report_actions:
            if 'boleta_pago' in report_xml_id and 'pago' in report.get('report_name', '').lower():
                target_report = report
                break
            elif 'aguinaldo' in report_xml_id and 'aguinaldo' in report.get('report_name', '').lower():
                target_report = report
                break
        
        # Si no se encuentra, usar el primero como fallback
        if not target_report and report_actions:
            target_report = report_actions[0]
        
        if not target_report:
            return {"success": False, "message": "No se pudo determinar el reporte a usar"}
        
        report_name = target_report['report_name']
        
        # En Odoo 17, solo funciona el método HTTP con autenticación de sesión
        if not username:
            return {
                "success": False, 
                "message": "Se requiere username para generar reportes en Odoo."
            }
        
        # Crear sesión autenticada
        session = requests.Session()
        
        # Autenticar
        login_url = f"{ODOO_URL}/web/session/authenticate"
        login_data = {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "db": ODOO_DB,
                "login": username,
                "password": password
            },
            "id": 1
        }
        
        headers = {'Content-Type': 'application/json'}
        login_response = session.post(login_url, json=login_data, headers=headers)
        
        if login_response.status_code != 200:
            return {
                "success": False, 
                "message": f"Error de autenticación HTTP: {login_response.status_code}"
            }
        
        # Verificar que la autenticación fue exitosa
        login_result = login_response.json()
        if 'error' in login_result:
            return {
                "success": False,
                "message": f"Error de autenticación: {login_result['error'].get('data', {}).get('message', 'Unknown')}"
            }
        
        # Construir URL del reporte
        record_ids_str = ','.join(map(str, record_ids))
        report_url = f"{ODOO_URL}/report/pdf/{report_name}/{record_ids_str}"
        
        response = session.get(report_url)
        
        if response.status_code == 200:
            # Verificar si es realmente un PDF
            content_type = response.headers.get('Content-Type', '')
            if 'pdf' in content_type or response.content.startswith(b'%PDF'):
                pdf_base64 = base64.b64encode(response.content).decode('utf-8')
                return {
                    "success": True,
                    "pdf_data": pdf_base64,
                    "report_used": target_report.get('name', ''),
                    "method": "http"
                }
        
        return {
            "success": False, 
            "message": f"Error al obtener PDF. Status: {response.status_code}. Verifique que el reporte '{report_name}' existe en Odoo."
        }
            
    except Exception as e:
        return {"success": False, "message": f"Error al renderizar reporte: {str(e)}"}
