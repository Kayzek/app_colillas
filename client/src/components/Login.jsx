import React, { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Container } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await window.electronAPI.login({ username, password });

            if (data.success) {
                localStorage.setItem('uid', data.uid);
                localStorage.setItem('password', password);
                localStorage.setItem('username', username);
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
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Card sx={{ padding: 4, width: '100%', boxShadow: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <LockIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography component="h1" variant="h5">
                        Login
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
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && (
                        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                            {error}
                        </Typography>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Entrar
                    </Button>
                </Box>
            </Card>
        </Container>
    );
};

export default Login;