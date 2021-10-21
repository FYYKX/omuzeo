import React from 'react';
import './config';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Home from './pages/Home';
import Artworks from './pages/Artworks';
import Navbar from './components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import theme from './ThemeContext';
import AuthContextProvider from './AuthContext';
import PrivateRoute from './PrivateRoute';
import Collections from './pages/Collections';
import Messages from './pages/Messages';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthContextProvider>
        <Router>
          <Navbar />
          <Switch>
            <Route exact path="/" component={Home} />
            <PrivateRoute exact path="/artworks" component={Artworks} />
            <PrivateRoute exact path="/collections" component={Collections} />
            <PrivateRoute exact path="/messages" component={Messages} />
          </Switch>
        </Router>
      </AuthContextProvider>
    </ThemeProvider>
  );
};

export default App;
