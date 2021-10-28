import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import { createContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

export const AuthContext = createContext();

const AuthContextProvider = (props) => {
  const [user, setUser] = useState({});
  const [hasCollection, setHasCollection] = useState(false);
  let history = useHistory();

  useEffect(() => {
    fcl.currentUser().subscribe(async (user) => {
      console.log(user);
      if (user.loggedIn) {
        localStorage.setItem('OMUZEO_IS_LOGGED_IN', 'true');
        await checkCollection(user);
      } else localStorage.setItem('OMUZEO_IS_LOGGED_IN', 'false');

      setUser({ ...user });
    });
  }, []);

  const logIn = async () => {
    await fcl.authenticate();
  };

  const logOut = async () => {
    await fcl.unauthenticate();
    history.push('/')
  };

  const getLoggedInStateFromLocalStorage = () => JSON.parse(localStorage.getItem('OMUZEO_IS_LOGGED_IN'));

  const isUserDataEmpty = JSON.stringify(user) === '{}';

  const checkCollection = async (user) => {
    try {
      fcl
        .send([
          fcl.script(`
            import OmuzeoItems from 0xOmuzeoItems
            import OmuzeoNFT from 0xOmuzeoNFT
            import NonFungibleToken from 0xNonFungibleToken
            import NFTStorefront from 0xNFTStorefront

            pub fun main(address: Address): Bool {
              let account = getAccount(address)
              let hasOmuzeoItems = account.getCapability<&OmuzeoItems.Collection{NonFungibleToken.CollectionPublic, OmuzeoItems.OmuzeoItemsCollectionPublic}>(OmuzeoItems.CollectionPublicPath).check()
              let hasOmuzeoNFT = account.getCapability<&OmuzeoNFT.Collection{NonFungibleToken.CollectionPublic, OmuzeoNFT.OmuzeoNFTCollectionPublic}>(OmuzeoNFT.CollectionPublicPath).check()
              let hasNFTStorefront = account.getCapability<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(NFTStorefront.StorefrontPublicPath).check()
              return hasOmuzeoItems && hasOmuzeoNFT && hasNFTStorefront
            }`),
          fcl.args([fcl.arg(user.addr, t.Address)]),
        ])
        .then(fcl.decode)
        .then(setHasCollection);
    } catch (error) {
      console.log(error);
      setHasCollection(false);
    }
  };

  const activateCollection = async () => {
    try {
      const txId = await fcl.send([
        fcl.transaction`
          import OmuzeoItems from 0xOmuzeoItems
          import OmuzeoNFT from 0xOmuzeoNFT
          import NonFungibleToken from 0xNonFungibleToken
          import NFTStorefront from 0xNFTStorefront

          transaction {
            prepare(signer: AuthAccount) {
              if signer.borrow<&OmuzeoItems.Collection>(from: OmuzeoItems.CollectionStoragePath) == nil {
                let collection <- OmuzeoItems.createEmptyCollection()
                signer.save(<-collection, to: OmuzeoItems.CollectionStoragePath)
                signer.link<&OmuzeoItems.Collection{NonFungibleToken.CollectionPublic, OmuzeoItems.OmuzeoItemsCollectionPublic}>(OmuzeoItems.CollectionPublicPath, target: OmuzeoItems.CollectionStoragePath)
              }
              if signer.borrow<&OmuzeoNFT.Collection>(from: OmuzeoNFT.CollectionStoragePath) == nil {
                let collection <- OmuzeoNFT.createEmptyCollection()
                signer.save(<-collection, to: OmuzeoNFT.CollectionStoragePath)
                signer.link<&OmuzeoNFT.Collection{NonFungibleToken.CollectionPublic, OmuzeoNFT.OmuzeoNFTCollectionPublic}>(OmuzeoNFT.CollectionPublicPath, target: OmuzeoNFT.CollectionStoragePath)
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
      await fcl.tx(txId).onceSealed();
      console.log('setup account success');
      setHasCollection(true);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isUserDataEmpty,
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
