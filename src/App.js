import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AuthContextProvider from './AuthContext';
import BasicCollectionActivationAlert from './components/BasicCollectionActivationAlert';
import Navbar from './components/Navbar';
import './config';
import Artworks from './pages/Artworks';
import Collections from './pages/Collections';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Messages from './pages/Messages';
import Sales from './pages/Sales';
import Tickets from './pages/Tickets';
import PrivateRoute from './PrivateRoute';
import theme from './ThemeContext';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthContextProvider>
        <Router>
          <BasicCollectionActivationAlert />
          <Navbar />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/sales" component={Sales} />
            <PrivateRoute exact path="/artworks" component={Artworks} />
            <PrivateRoute exact path="/collections" component={Collections} />
            <PrivateRoute exact path="/messages" component={Messages} />
            <PrivateRoute exact path="/marketplace" component={Marketplace} />
            <PrivateRoute exact path="/tickets" component={Tickets} />
          </Switch>
        </Router>
      </AuthContextProvider>
    </ThemeProvider>
  );
};

export default App;
