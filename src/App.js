import { Container } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AuthContextProvider from './AuthContext';
import BasicCollectionActivationAlert from './components/BasicCollectionActivationAlert';
import Navbar from './components/Navbar';
import './config';
import Create from './pages/Create';
import Home from './pages/Home';
import NFTs from './pages/NFTs';
import Sales from './pages/Sales';
import PrivateRoute from './PrivateRoute';
import theme from './ThemeContext';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthContextProvider>
          <BasicCollectionActivationAlert />
          <Navbar />
          <Container style={{ padding: '40px' }}>
            <Switch>
              <Route exact path="/" component={Home} />
              <PrivateRoute exact path="/create" component={Create} />
              <PrivateRoute exact path="/nfts" component={NFTs} />
              <PrivateRoute exact path="/sales" component={Sales} />
            </Switch>
          </Container>
        </AuthContextProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
