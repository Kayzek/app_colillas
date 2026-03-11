import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Card, CardContent, Button, Typography, Container, Select,
    MenuItem, InputLabel, FormControl, Grid, CircularProgress,
    AppBar, Toolbar, IconButton, Tooltip, Snackbar, Alert, Paper, Divider, Stack
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '../ColorModeContext';
import Logo from './Logo';

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const Home = () => {
    const [lotes, setLotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    
    // Filtros
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedLote, setSelectedLote] = useState('');

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const navigate = useNavigate();
    const { mode, toggleColorMode } = useColorMode();

    const username = localStorage.getItem('username') || 'Usuario';

    const showMessage = (message, severity = 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    useEffect(() => {
        const fetchLotes = async () => {
            const uid = localStorage.getItem('uid');
            const password = localStorage.getItem('password');

            if (!uid || !password) {
                navigate('/');
                return;
            }

            try {
                const data = await window.electronAPI.getLotes({ uid: parseInt(uid), password });
                if (Array.isArray(data)) {
                    setLotes(data);
                } else {
                    showMessage('Error al obtener lotes');
                    if (data?.message === 'Credenciales inválidas') {
                        navigate('/');
                    }
                }
            } catch (err) {
                console.error("Error fetching lotes:", err);
                showMessage('Error de conexión al obtener lotes');
            } finally {
                setLoading(false);
            }
        };

        fetchLotes();
    }, [navigate]);

    // Lógica de filtrado dinámico
    const companies = useMemo(() => {
        const unique = new Set(lotes.map(l => l.company_id ? l.company_id[1] : 'Sin Compañía'));
        return Array.from(unique).sort();
    }, [lotes]);

    const years = useMemo(() => {
        if (!selectedCompany) return [];
        const filtered = lotes.filter(l => (l.company_id ? l.company_id[1] : 'Sin Compañía') === selectedCompany);
        const unique = new Set(filtered.map(l => l.date_start ? l.date_start.substring(0, 4) : 'N/A'));
        return Array.from(unique).sort((a, b) => b - a);
    }, [lotes, selectedCompany]);

    const months = useMemo(() => {
        if (!selectedYear) return [];
        const filtered = lotes.filter(l => 
            (l.company_id ? l.company_id[1] : 'Sin Compañía') === selectedCompany &&
            l.date_start?.startsWith(selectedYear)
        );
        const uniqueMonths = new Set(filtered.map(l => {
            if (!l.date_start) return -1;
            return parseInt(l.date_start.substring(5, 7)) - 1;
        }));
        return Array.from(uniqueMonths).filter(m => m !== -1).sort((a, b) => a - b);
    }, [lotes, selectedCompany, selectedYear]);

    const filteredLotes = useMemo(() => {
        if (!selectedMonth && selectedMonth !== 0) return [];
        return lotes.filter(l => {
            const companyMatch = (l.company_id ? l.company_id[1] : 'Sin Compañía') === selectedCompany;
            const yearMatch = l.date_start?.startsWith(selectedYear);
            const monthMatch = l.date_start && parseInt(l.date_start.substring(5, 7)) - 1 === selectedMonth;
            return companyMatch && yearMatch && monthMatch;
        });
    }, [lotes, selectedCompany, selectedYear, selectedMonth]);

    // Manejadores de cambios
    const handleCompanyChange = (e) => {
        setSelectedCompany(e.target.value);
        setSelectedYear('');
        setSelectedMonth('');
        setSelectedLote('');
    };

    const handleYearChange = (e) => {
        setSelectedYear(e.target.value);
        setSelectedMonth('');
        setSelectedLote('');
    };

    const handleMonthChange = (e) => {
        setSelectedMonth(e.target.value);
        setSelectedLote('');
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handlePrint = async () => {
        if (!selectedLote) return;
        setIsPrinting(true);
        try {
            const uid = localStorage.getItem('uid');
            const password = localStorage.getItem('password');
            const result = await window.electronAPI.printColillas({
                uid: parseInt(uid), password, lotId: selectedLote, username
            });

            if (result.success) {
                const byteCharacters = atob(result.pdf_data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `colillas_lote_${selectedLote}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                showMessage('PDF descargado exitosamente', 'success');
            } else {
                showMessage(`Error: ${result.message || 'No se pudo generar el PDF'}`);
            }
        } catch (err) {
            console.error("Error printing:", err);
            showMessage('Error de conexión al generar el PDF interno');
        } finally {
            setIsPrinting(false);
        }
    };

    const selectedLoteObj = lotes.find(l => l.id === selectedLote);
    const filtersComplete = selectedCompany && selectedYear && (selectedMonth !== '');

    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default', color: 'text.primary' }}>
            <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Toolbar>
                    <Logo sx={{ height: 32, width: 32, mr: 2, color: '#fff' }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 1.5, color: '#fff' }}>
                        COLILLAS PRO
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, lineHeight: 1 }}>Sesión iniciada</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{username}</Typography>
                        </Box>
                        <Tooltip title={`Cambiar a modo ${mode === 'light' ? 'oscuro' : 'claro'}`}>
                            <IconButton onClick={toggleColorMode} color="inherit" sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cerrar Sesión">
                            <IconButton color="inherit" onClick={handleLogout} sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 15 }}>
                        <CircularProgress size={70} thickness={5} sx={{ mb: 3, color: '#1a237e' }} />
                        <Typography color="textPrimary" variant="h5" fontWeight="bold">Sincronizando con Odoo...</Typography>
                        <Typography color="textSecondary">Esto puede tardar unos segundos según el volumen de datos.</Typography>
                    </Box>
                ) : (
                    <Grid container spacing={4}>
                        {/* Panel de Filtros Secuenciales */}
                        <Grid item xs={12} lg={4}>
                            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', bgcolor: 'background.paper' }}>
                                <Typography variant="h5" fontWeight="800" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
                                    Paso 1: Filtrar
                                </Typography>
                                
                                <Stack spacing={4}>
                                    <FormControl fullWidth>
                                        <Typography variant="overline" color="textSecondary" sx={{ mb: 1, fontWeight: 'bold' }}>1. Empresa</Typography>
                                        <Select 
                                            value={selectedCompany} 
                                            onChange={handleCompanyChange}
                                            displayEmpty
                                            startAdornment={<BusinessIcon sx={{ mr: 1, color: 'action.active' }} />}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="" disabled>Seleccione una empresa</MenuItem>
                                            {companies.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth disabled={!selectedCompany}>
                                        <Typography variant="overline" color="textSecondary" sx={{ mb: 1, fontWeight: 'bold' }}>2. Año Fiscal</Typography>
                                        <Select 
                                            value={selectedYear} 
                                            onChange={handleYearChange}
                                            displayEmpty
                                            startAdornment={<CalendarTodayIcon sx={{ mr: 1, color: 'action.active' }} />}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="" disabled>Seleccione el año</MenuItem>
                                            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth disabled={!selectedYear}>
                                        <Typography variant="overline" color="textSecondary" sx={{ mb: 1, fontWeight: 'bold' }}>3. Mes</Typography>
                                        <Select 
                                            value={selectedMonth} 
                                            onChange={handleMonthChange}
                                            displayEmpty
                                            startAdornment={<DateRangeIcon sx={{ mr: 1, color: 'action.active' }} />}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="" disabled>Seleccione el mes</MenuItem>
                                            {months.map(m => <MenuItem key={m} value={m}>{MONTHS[m]}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Selección de Lote e Impresión */}
                        <Grid item xs={12} lg={8}>
                            <Grid container spacing={4} direction="column" sx={{ height: '100%' }}>
                                <Grid item sx={{ flexGrow: 1 }}>
                                    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', bgcolor: 'background.paper' }}>
                                        <Typography variant="h5" fontWeight="800" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                                            Paso 2: Procesar
                                        </Typography>

                                        {!filtersComplete ? (
                                            <Box sx={{ p: 6, textAlign: 'center', opacity: 0.5, border: '2px dashed', borderColor: 'divider', borderRadius: 4 }}>
                                                <FilterListIcon sx={{ fontSize: 60, mb: 2 }} />
                                                <Typography variant="h6">Complete los filtros para visualizar lotes</Typography>
                                            </Box>
                                        ) : (
                                            <Stack spacing={4}>
                                                <FormControl fullWidth>
                                                    <Typography variant="overline" color="textSecondary" sx={{ mb: 1, fontWeight: 'bold' }}>Lotes encontrados ({filteredLotes.length})</Typography>
                                                    <Select
                                                        value={selectedLote}
                                                        onChange={(e) => setSelectedLote(e.target.value)}
                                                        displayEmpty
                                                        sx={{ borderRadius: 2 }}
                                                    >
                                                        <MenuItem value="" disabled>Seleccione el lote a imprimir</MenuItem>
                                                        {filteredLotes.map((lote) => (
                                                            <MenuItem key={lote.id} value={lote.id} sx={{ py: 2 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                                    <Typography variant="body1" fontWeight="bold">{lote.name}</Typography>
                                                                    <Chip label={`ID: ${lote.id}`} size="small" variant="outlined" />
                                                                </Box>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>

                                                {selectedLoteObj && (
                                                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8f9fa', border: '1px solid', borderColor: 'primary.main' }}>
                                                        <Grid container alignItems="center" spacing={2}>
                                                            <Grid item>
                                                                <CheckCircleOutlineIcon color="primary" sx={{ fontSize: 40 }} />
                                                            </Grid>
                                                            <Grid item xs>
                                                                <Typography variant="subtitle2" color="primary" fontWeight="bold">LOTE CONFIGURADO</Typography>
                                                                <Typography variant="h6" fontWeight="bold">{selectedLoteObj.name}</Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    El PDF contendrá todos los recibos de este periodo.
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item>
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    size="large"
                                                                    startIcon={isPrinting ? <CircularProgress size={24} color="inherit" /> : <DownloadIcon />}
                                                                    onClick={handlePrint}
                                                                    disabled={isPrinting}
                                                                    sx={{ 
                                                                        py: 2, px: 4,
                                                                        borderRadius: 3, 
                                                                        fontWeight: 900,
                                                                        boxShadow: '0 8px 16px rgba(26,35,126,0.3)',
                                                                    }}
                                                                >
                                                                    {isPrinting ? 'GENERANDO...' : 'DESCARGAR PDF'}
                                                                </Button>
                                                            </Grid>
                                                        </Grid>
                                                    </Paper>
                                                )}
                                            </Stack>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                )}
            </Container>

            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontWeight: 'bold' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// Componente Chip pequeño auxiliar
const Chip = ({ label, size, variant }) => (
    <Box sx={{ 
        px: 1, py: 0.2, 
        border: '1px solid rgba(0,0,0,0.12)', 
        borderRadius: 1, 
        fontSize: '0.65rem', 
        fontWeight: 'bold',
        color: 'text.secondary'
    }}>
        {label}
    </Box>
);

export default Home;