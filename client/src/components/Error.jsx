import React from "react";
import { Box, Card, Typography, Container } from "@mui/material";

const Error = () => {
    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
            <Card sx={{ padding: 4, width: '100%', boxShadow: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Error 404
                    </Typography>
                </Box>
            </Card>
        </Container>
    );
}

export default Error;