import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AuthContextProvider from './AuthContext';
import Navbar from './components/Navbar';
import './config';
import Artworks from './pages/Artworks';
import Collections from './pages/Collections';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Sales from './pages/Sales';
import PrivateRoute from './PrivateRoute';
import theme from './ThemeContext';

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
            <PrivateRoute exact path="/sales" component={Sales} />
          </Switch>
        </Router>
      </AuthContextProvider>
    </ThemeProvider>
  );
};

export default App;
