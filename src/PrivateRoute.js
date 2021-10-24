import { useContext } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const PrivateRoute = ({ component: Component, scopes = [], ...rest }) => {
  const { user } = useContext(AuthContext);

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!user?.loggedIn) return <Redirect to="/" />;
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;
