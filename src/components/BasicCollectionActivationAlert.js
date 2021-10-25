import React, { useContext } from 'react';
import Alert from '@mui/material/Alert';
import { AuthContext } from '../AuthContext';

const BasicCollectionActivationAlert = () => {
  const { user, hasCollection, activateCollection } = useContext(AuthContext);

  const getLink = () => (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a href="#" onClick={activateCollection}>
      click here
    </a>
  );

  if (user?.loggedIn && !hasCollection)
    return <Alert severity="error">Please activate your collection {getLink()}</Alert>;
  return <></>;
};

export default BasicCollectionActivationAlert;
