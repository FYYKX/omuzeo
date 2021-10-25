import { useContext } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const PrivateRoute = ({ component: Component, scopes = [], ...rest }) => {
  const { getLoggedInStateFromLocalStorage } = useContext(AuthContext);

  return (
    <Route
      {...rest}
      render={(props) => {
        const isLoggedIn = getLoggedInStateFromLocalStorage();
        if (!isLoggedIn) return <Redirect to="/" />;
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;
