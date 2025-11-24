import React, { useState, useEffect } from 'react';
import { Box, Card, Button, Typography, Container, Select, MenuItem, InputLabel, FormControl, Grid, CircularProgress, Alert, ListSubheader } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import EventIcon from '@mui/icons-material/Event';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLotes = async () => {
            const uid = localStorage.getItem('uid');
            const password = localStorage.getItem('password');

            if (!uid || !password) {
                navigate('/');
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/nomina/lotes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ uid: parseInt(uid), password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setLotes(data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.detail || 'Error al obtener lotes');
                    if (response.status === 401) {
                        navigate('/');
                    }
                }
            } catch (err) {
                console.error("Error fetching lotes:", err);
                setError('Error de conexión al obtener lotes');
            } finally {
                setLoading(false);
            }
        };

        fetchLotes();
    }, [navigate]);

    const handleLoteChange = (event) => {
        setSelectedLote(event.target.value);
    };

    const handlePrint = async () => {
        if (selectedLote) {
            setLoading(true);
            try {
                const uid = localStorage.getItem('uid');
                const password = localStorage.getItem('password');
                const username = localStorage.getItem('username');

                const response = await fetch(`${import.meta.env.VITE_API_URL}/nomina/print`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ uid: parseInt(uid), password, lot_id: selectedLote, username }),
                });

                if (response.ok) {
                    // Create a blob from the PDF Stream
                    const blob = await response.blob();
                    // Create a link to download it
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `colillas_lote_${selectedLote}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.detail || 'No se pudo generar el PDF'}`);
                }
            } catch (err) {
                console.error("Error printing:", err);
                alert('Error de conexión al generar el PDF');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                    Generador de Colillas de Nómina
                </Typography>
                <Button variant="outlined" color="secondary" onClick={() => {
                    localStorage.clear();
                    navigate('/');
                }}>
                    Cerrar Sesión
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {/* Tarjeta de Selección de Lote */}
                    <Grid item xs={12}>
                        <Card sx={{ padding: 3, boxShadow: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <EventIcon color="action" sx={{ mr: 1 }} />
                                <Typography variant="h6">Selección de Lote</Typography>
                            </Box>
                            <FormControl fullWidth>
                                <InputLabel id="lote-select-label">Lote de Nómina</InputLabel>
                                <Select
                                    labelId="lote-select-label"
                                    label="Lote de Nómina"
                                    value={selectedLote}
                                    onChange={handleLoteChange}
                                    renderValue={(selected) => {
                                        const selectedLoteObj = lotes.find(l => l.id === selected);
                                        if (selectedLoteObj) {
                                            return `${selectedLoteObj.name} (${selectedLoteObj.date_start})`;
                                        }
                                        return '';
                                    }}
                                >
                                    {Object.entries(lotes.reduce((acc, lote) => {
                                        const companyName = lote.company_id ? lote.company_id[1] : 'Sin Compañía';
                                        if (!acc[companyName]) acc[companyName] = [];
                                        acc[companyName].push(lote);
                                        return acc;
                                    }, {})).map(([company, companyLotes]) => [
                                        <ListSubheader key={company} sx={{ fontWeight: 'bold', color: 'primary.main', bgcolor: 'background.paper' }}>
                                            {company}
                                        </ListSubheader>,
                                        ...companyLotes.map((lote) => (
                                            <MenuItem key={lote.id} value={lote.id} sx={{ pl: 4 }}>
                                                {lote.name} ({lote.date_start})
                                            </MenuItem>
                                        ))
                                    ])}
                                </Select>
                            </FormControl>
                        </Card>
                    </Grid>

                    {/* Tarjeta de Acción */}
                    <Grid item xs={12}>
                        <Card sx={{ padding: 3, boxShadow: 2, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Acción
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<PrintIcon />}
                                sx={{ padding: 2, fontSize: '1.1rem' }}
                                onClick={handlePrint}
                                disabled={!selectedLote}
                            >
                                Imprimir Colillas del Lote
                            </Button>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Container>
    );
};

export default Home;