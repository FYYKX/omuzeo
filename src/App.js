import React from 'react';
import './config';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Home from './pages/Home';
import Artworks from './pages/Artworks';
import Navbar from './components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import theme from './ThemeContext';
import AuthContextProvider from './AuthContext';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthContextProvider>
        <Router>
          <Navbar />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/artworks" component={Artworks} />
          </Switch>
        </Router>
      </AuthContextProvider>
    </ThemeProvider>
  );
};

export default App;
