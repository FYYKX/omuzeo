import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AuthContextProvider from './AuthContext';
import BasicCollectionActivationAlert from './components/BasicCollectionActivationAlert';
import Navbar from './components/Navbar';
import './config';
import NFTs from './pages/NFTs';
import Collections from './pages/Collections';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Messages from './pages/Messages';
import Sales from './pages/Sales';
import Tickets from './pages/Tickets';
import PrivateRoute from './PrivateRoute';
import theme from './ThemeContext';
import {Container} from "@mui/material";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthContextProvider>
        <Router>
          <BasicCollectionActivationAlert />
          <Navbar />
          <Container style={{ padding: '40px'}}>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/sales" component={Sales} />
              <PrivateRoute exact path="/nfts" component={NFTs} />
              <PrivateRoute exact path="/collections" component={Collections} />
              <PrivateRoute exact path="/messages" component={Messages} />
              <PrivateRoute exact path="/marketplace" component={Marketplace} />
              <PrivateRoute exact path="/tickets" component={Tickets} />
            </Switch>
          </Container>
        </Router>
      </AuthContextProvider>
    </ThemeProvider>
  );
};

export default App;
