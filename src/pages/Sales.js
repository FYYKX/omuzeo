import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import Sale from '../components/Sale';

function Sales() {
  const { user } = useContext(AuthContext);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    try {
      fcl
        .send([
          fcl.script(`
          import NFTStorefront from 0xNFTStorefront

          pub fun main(account: Address): [UInt64] {
            let storefrontRef = getAccount(account)
              .getCapability<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(
                NFTStorefront.StorefrontPublicPath
              )
              .borrow()
              ?? panic("Could not borrow public storefront from address")

            return storefrontRef.getListingIDs()
          }`),
          fcl.args([fcl.arg(user.addr, t.Address)]),
        ])
        .then(fcl.decode)
        .then(setSales);
    } catch (error) {
      console.log(error);
    }
  }, [user]);

  async function setup() {
    try {
      const txId = await fcl.send([
        fcl.transaction(`
        import NFTStorefront from 0xNFTStorefront

        transaction {
          prepare(acct: AuthAccount) {
            if acct.borrow<&NFTStorefront.Storefront>(from: NFTStorefront.StorefrontStoragePath) == nil {
              let storefront <- NFTStorefront.createStorefront() as! @NFTStorefront.Storefront
              acct.save(<-storefront, to: NFTStorefront.StorefrontStoragePath)
              acct.link<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(NFTStorefront.StorefrontPublicPath, target: NFTStorefront.StorefrontStoragePath)
            }
          }
        }`),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(100),
      ]);

      const result = await fcl.tx(txId).onceSealed();
      console.log(result);
    } catch (error) {
      console.log(error);
    }
  }

  async function sale() {
    try {
      // https://github.com/onflow/nft-storefront/blob/main/transactions/sell_item.cdc
      const txId = await fcl.send([
        fcl.transaction(`
        import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FlowToken from 0xFlowToken
        import OmuzeoItems from 0xOmuzeoItems
        import NFTStorefront from 0xNFTStorefront

        transaction(saleItemID: UInt64, saleItemPrice: UFix64) {
          let flowReceiver: Capability<&FlowToken.Vault{FungibleToken.Receiver}>
          let omuzeoItemsProvider: Capability<&OmuzeoItems.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>
          let storefront: &NFTStorefront.Storefront

          prepare(acct: AuthAccount) {
            // We need a provider capability, but one is not provided by default so we create one if needed.
            let omuzeoItemsCollectionProviderPrivatePath = /private/OmuzeoItemsCollectionProviderForNFTStorefront

            self.flowReceiver = acct.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            assert(self.flowReceiver.borrow() != nil, message: "Missing or mis-typed FlowToken receiver")

            if !acct.getCapability<&OmuzeoItems.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoItemsCollectionProviderPrivatePath)!.check() {
              acct.link<&OmuzeoItems.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoItemsCollectionProviderPrivatePath, target: OmuzeoItems.CollectionStoragePath)
            }

            self.omuzeoItemsProvider = acct.getCapability<&OmuzeoItems.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoItemsCollectionProviderPrivatePath)!
            assert(self.omuzeoItemsProvider.borrow() != nil, message: "Missing or mis-typed OmuzeoItems.Collection provider")

            self.storefront = acct.borrow<&NFTStorefront.Storefront>(from: NFTStorefront.StorefrontStoragePath)
              ?? panic("Missing or mis-typed NFTStorefront Storefront")
          }

          execute {
            let saleCut = NFTStorefront.SaleCut(
              receiver: self.flowReceiver,
              amount: saleItemPrice
            )
            self.storefront.createListing(
              nftProviderCapability: self.omuzeoItemsProvider,
              nftType: Type<@OmuzeoItems.NFT>(),
              nftID: saleItemID,
              salePaymentVaultType: Type<@FlowToken.Vault>(),
              saleCuts: [saleCut]
            )
          }
        }`),
        fcl.args([fcl.arg(Number(1), t.UInt64), fcl.arg(String('20.0'), t.UFix64)]),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(100),
      ]);
      const result = await fcl.tx(txId).onceSealed();
      console.log(result);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <ButtonGroup variant="outlined" aria-label="outlined button group">
        <Button onClick={setup}>Setup Account</Button>
        <Button onClick={sale}>Create Sale</Button>
      </ButtonGroup>
      <div>
        {sales.map((id) => (
          <Sale key={id} address={user.addr} id={id} />
        ))}
      </div>
    </>
  );
}

export default Sales;
