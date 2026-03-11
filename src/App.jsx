import React, { useMemo } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from './theme';
import { ColorModeProvider, useColorMode } from './ColorModeContext';
import Login from './components/Login';
import Home from './components/Home';
import Error from './components/Error';

const AppContent = () => {
  const { mode } = useColorMode();
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/error" element={<Error />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

function App() {
  return (
    <ColorModeProvider>
      <AppContent />
    </ColorModeProvider>
  );
}

export default App;
