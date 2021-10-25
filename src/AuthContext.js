import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import { createContext, useEffect, useState } from 'react';

// import { useHistory } from 'react-router';

export const AuthContext = createContext();

const AuthContextProvider = (props) => {
  const [user, setUser] = useState({});
  const [hasCollection, setHasCollection] = useState(false);

  useEffect(() => {
    fcl.currentUser().subscribe(async (user) => {
      console.log(user);
      if (user.loggedIn) localStorage.setItem('OMUZEO_IS_LOGGED_IN', 'true');
      else localStorage.setItem('OMUZEO_IS_LOGGED_IN', 'false');

      setUser({ ...user });
    });
  }, []);

  const logIn = async () => {
    await fcl.authenticate();
  };

  const logOut = async () => {
    await fcl.unauthenticate();
  };

  const getLoggedInStateFromLocalStorage = () => JSON.parse(localStorage.getItem('OMUZEO_IS_LOGGED_IN'));

  const checkCollection = async () => {
    try {
      fcl
        .send([
          fcl.script(`
            import OmuzeoItems from 0xOmuzeoItems
            import NFTStorefront from 0xNFTStorefront
            import NonFungibleToken from 0xNonFungibleToken

            pub fun main(address: Address): Bool {
              let account = getAccount(address)
              let hasOmuzeoItems = account.getCapability<&OmuzeoItems.Collection{NonFungibleToken.CollectionPublic, OmuzeoItems.OmuzeoItemsCollectionPublic}>(OmuzeoItems.CollectionPublicPath).check()
              let hasNFTStorefront = account.getCapability<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(NFTStorefront.StorefrontPublicPath).check()
              return hasOmuzeoItems && hasNFTStorefront
            }`),
          fcl.args([fcl.arg(user.addr, t.Address)]),
        ])
        .then(fcl.decode)
        .then(setHasCollection);
    } catch (error) {
      console.log(error);
    }
  };

  const activateCollection = async (event) => {
    event.preventDefault();

    try {
      const transactionId = await fcl.send([
        fcl.transaction`
          import NonFungibleToken from 0xNonFungibleToken
          import OmuzeoItems from 0xOmuzeoItems
          import NFTStorefront from 0xNFTStorefront

          transaction {
            prepare(signer: AuthAccount) {
              if signer.borrow<&OmuzeoItems.Collection>(from: OmuzeoItems.CollectionStoragePath) == nil {
                let collection <- OmuzeoItems.createEmptyCollection()
                signer.save(<-collection, to: OmuzeoItems.CollectionStoragePath)
                signer.link<&OmuzeoItems.Collection{NonFungibleToken.CollectionPublic, OmuzeoItems.OmuzeoItemsCollectionPublic}>(OmuzeoItems.CollectionPublicPath, target: OmuzeoItems.CollectionStoragePath)
              }
              if signer.borrow<&NFTStorefront.Storefront>(from: NFTStorefront.StorefrontStoragePath) == nil {
                let storefront <- NFTStorefront.createStorefront() as! @NFTStorefront.Storefront
                signer.save(<-storefront, to: NFTStorefront.StorefrontStoragePath)
                signer.link<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(NFTStorefront.StorefrontPublicPath, target: NFTStorefront.StorefrontStoragePath)
              }
            }
          }`,
        fcl.payer(fcl.authz),
        fcl.proposer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(100),
      ]);
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
        getLoggedInStateFromLocalStorage,
        activateCollection,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
