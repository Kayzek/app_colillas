import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#1a237e' : '#7986cb', // Azul más claro en modo oscuro para contraste
      light: '#534bae',
      dark: '#000051',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#3949ab',
      light: '#6f74dd',
      dark: '#00227b',
      contrastText: '#ffffff',
    },
    background: {
      default: mode === 'light' ? '#f4f6f8' : '#050510',
      paper: mode === 'light' ? '#ffffff' : '#111125',
    },
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
    text: {
      primary: mode === 'light' ? '#1a237e' : '#f5f5f5',
      secondary: mode === 'light' ? 'rgba(26, 35, 126, 0.7)' : 'rgba(255, 255, 255, 0.6)',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#1a237e' : '#0a0a1a',
          backgroundImage: 'none',
        },
      },
    },
  },
});
