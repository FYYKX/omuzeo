import { createTheme } from '@mui/material/styles';

// TODO: Add the styles for headings
// <h1>h1</h1>
// <h2>h2</h2>
// <h3>h3</h3>
// <h4>h4</h4>
// <h5>h5</h5>
// <h6>h6</h6>
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
      fontWeight: 600
    },
    h5: {
      fontSize: 16,
      fontWeight: 600
    },
    // body: {
    //   color: 'green',
    //   fontWeight: 300,
    // }
  },
});

export default theme;
