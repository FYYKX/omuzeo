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
      main: '#1A82e2',
    },
    secondary: {
      main: '#294661',
    },
  },
  spacing: 2,
  typography: {
    fontFamily: 'Helvetica Neue',
    fontSize: 14,
  },
});

export default theme;