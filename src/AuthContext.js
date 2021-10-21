import { createContext, useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';

// import { useHistory } from 'react-router';

export const AuthContext = createContext();

const AuthContextProvider = (props) => {
  const [user, setUser] = useState({});
  const [hasCollection, setHasCollection] = useState(false);

  useEffect(() => {
    fcl.currentUser().subscribe(async (user) => {
      setUser({ ...user });
    });
  }, []);

  const logIn = async () => {
    await fcl.authenticate();
  };

  const logOut = async () => {
    await fcl.unauthenticate();
  };

  const activateCollection = async (event) => {
    event.preventDefault();

    try {
      const transactionId = await fcl
        .send([
          fcl.transaction`
          import OmuseoContract from 0xOmuseoContract

          transaction {
            prepare(acct: AuthAccount) {
              let collection <- OmuseoContract.createEmptyCollection()
              acct.save<@OmuseoContract.Collection>(<-collection, to: /storage/NFTCollection)
              acct.link<&{OmuseoContract.NFTReceiver}>(/public/NFTReceiver, target: /storage/NFTCollection)
            }
          }
        `,
          fcl.args([]),
          fcl.payer(fcl.authz),
          fcl.proposer(fcl.authz),
          fcl.authorizations([fcl.authz]),
          fcl.limit(9999),
        ])
        .then(fcl.decode);
      console.log(transactionId);
      const result = await fcl.tx(transactionId).onceSealed();

      if (result?.errorMessage === '') setHasCollection(true);
    } catch (error) {
      console.error(error);
      setHasCollection(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hasCollection,
        logIn,
        logOut,
        activateCollection,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
