import * as fcl from '@onflow/fcl';
import { createContext, useEffect, useState } from 'react';

// import { useHistory } from 'react-router';

export const AuthContext = createContext();

const AuthContextProvider = (props) => {
  const [user, setUser] = useState({});
  const [hasCollection, setHasCollection] = useState(false);

  useEffect(() => {
    fcl.currentUser().subscribe(async (user) => {
      console.log(user);
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
      const transactionId = await fcl.send([
        fcl.transaction`
          import NonFungibleToken from 0xNonFungibleToken
          import OmuzeoItems from 0xOmuzeoItems

          transaction {
            prepare(signer: AuthAccount) {
              if signer.borrow<&OmuzeoItems.Collection>(from: OmuzeoItems.CollectionStoragePath) == nil {
                let collection <- OmuzeoItems.createEmptyCollection()
                signer.save(<-collection, to: OmuzeoItems.CollectionStoragePath)
                signer.link<&OmuzeoItems.Collection{NonFungibleToken.CollectionPublic, OmuzeoItems.OmuzeoItemsCollectionPublic}>(OmuzeoItems.CollectionPublicPath, target: OmuzeoItems.CollectionStoragePath)
              }
            }
          }`,
        fcl.args([]),
        fcl.payer(fcl.authz),
        fcl.proposer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(9999),
      ]);
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
