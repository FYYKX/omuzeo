import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff00ab',
    },
    secondary: {
      main: '#294661',
    },
  },
  spacing: 2,
  typography: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: 400,
    button: {
      textTransform: 'none',
    },
    h4: {
      fontSize: 20,
      fontWeight: 600,
    },
    h5: {
      fontSize: 16,
      fontWeight: 600,
    },
  },
});

export default theme;
