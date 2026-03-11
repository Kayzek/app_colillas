import React, { useState, useEffect } from 'react';
import { Box, Card, TextField, Button, Typography, Container, Checkbox, FormControlLabel } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '../ColorModeContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { IconButton, Tooltip, Alert } from '@mui/material';
import Logo from './Logo';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { mode, toggleColorMode } = useColorMode();

    // Cargar usuario recordado
    useEffect(() => {
        const savedUser = localStorage.getItem('remembered_username');
        if (savedUser) {
            setUsername(savedUser);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await window.electronAPI.login({ username, password });

            if (data.success) {
                localStorage.setItem('uid', data.uid);
                localStorage.setItem('password', password);
                localStorage.setItem('username', username);
                
                if (rememberMe) {
                    localStorage.setItem('remembered_username', username);
                } else {
                    localStorage.removeItem('remembered_username');
                }
                
                navigate('/home');
            } else {
                setError(data.message || data.detail || 'Error de autenticación');
            }
        } catch (err) {
            console.error("Login error:", err);
            setError('Error de conexión con el servidor interno');
        }
    };

    return (
        <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            position: 'relative',
            backgroundColor: 'background.default',
            color: 'text.primary'
        }}>
            <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
                <Tooltip title={`Cambiar a modo ${mode === 'light' ? 'oscuro' : 'claro'}`}>
                    <IconButton onClick={toggleColorMode} color="primary">
                        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                </Tooltip>
            </Box>
            <Container maxWidth="xs" sx={{ width: '100%' }}>
                <Card sx={{ padding: 4, width: '100%', boxShadow: mode === 'dark' ? 10 : 4, borderRadius: 4, bgcolor: 'background.paper' }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Logo 
                            sx={{ 
                                width: 80, height: 80, 
                                borderRadius: 3,
                                mb: 2,
                                boxShadow: 3
                            }} 
                        />
                        <Typography component="h1" variant="h4" fontWeight="bold">
                            Colillas Pro
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Gestión profesional de nómina Odoo
                        </Typography>
                    </Box>
                    <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Usuario"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            variant="outlined"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            variant="outlined"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox 
                                    value="remember" 
                                    color="primary" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                            }
                            label="Recordar usuario"
                        />
                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                        )}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                        >
                            Iniciar Sesión
                        </Button>
                    </Box>
                </Card>
            </Container>
        </Box>
    );
};

export default Login;