import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';
import NFT from './NFT';

function Sale({ address, id }) {
  const [sale, setSale] = useState({});
  useEffect(() => {
    try {
      fcl
        .send([
          fcl.script(`
            import NFTStorefront from 0xNFTStorefront

            pub fun main(account: Address, listingResourceID: UInt64): NFTStorefront.ListingDetails {
              let storefrontRef = getAccount(account)
                .getCapability<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(
                  NFTStorefront.StorefrontPublicPath
                )
                .borrow()
                ?? panic("Could not borrow public storefront from address")

              let listing = storefrontRef.borrowListing(listingResourceID: listingResourceID)
                ?? panic("No item with that ID")

              return listing.getDetails()
            }`),
          fcl.args([fcl.arg(address, t.Address), fcl.arg(Number(id), t.UInt64)]),
        ])
        .then(fcl.decode)
        .then(setSale);
    } catch (error) {
      console.log(error);
    }
  }, [address, id]);

  async function buy(id, address) {
    try {
      const txId = await fcl.send([
        fcl.transaction(`
        import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FlowToken from 0xFlowToken
        import OmuzeoItems from 0xOmuzeoItems
        import NFTStorefront from 0xNFTStorefront

        transaction(listingResourceID: UInt64, storefrontAddress: Address) {
          let paymentVault: @FungibleToken.Vault
          let omuzeoItemsCollection: &OmuzeoItems.Collection{NonFungibleToken.Receiver}
          let storefront: &NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}
          let listing: &NFTStorefront.Listing{NFTStorefront.ListingPublic}

          prepare(acct: AuthAccount) {
            self.storefront = getAccount(storefrontAddress)
              .getCapability<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(
                NFTStorefront.StorefrontPublicPath
              )!
              .borrow()
              ?? panic("Could not borrow Storefront from provided address")

            self.listing = self.storefront.borrowListing(listingResourceID: listingResourceID)
              ?? panic("No Offer with that ID in Storefront")
            let price = self.listing.getDetails().salePrice

            let mainFlowVault = acct.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Cannot borrow FlowToken vault from acct storage")
            self.paymentVault <- mainFlowVault.withdraw(amount: price)

            self.omuzeoItemsCollection = acct.borrow<&OmuzeoItems.Collection{NonFungibleToken.Receiver}>(
              from: OmuzeoItems.CollectionStoragePath
            ) ?? panic("Cannot borrow NFT collection receiver from account")
          }

          execute {
            let item <- self.listing.purchase(
              payment: <-self.paymentVault
            )

            self.omuzeoItemsCollection.deposit(token: <-item)
          }
        }`),
        fcl.args([fcl.arg(Number(id), t.UInt64), fcl.arg(address, t.Address)]),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(1000),
      ]);

      await fcl.tx(txId).onceSealed();
      console.log('buy success');
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <Card sx={{ maxWidth: 500 }}>
      <CardContent>
        <NFT address={address} id={sale?.nftID} />
        <Typography>{sale.storefrontID}</Typography>
        <Typography>{sale.purchased}</Typography>
        <Typography>{sale.nftType}</Typography>
        <Typography>{sale.salePaymentVaultType}</Typography>
        <Typography variant="h5">{sale.salePrice}</Typography>
        {sale.saleCuts?.map((sc) => (
          <Typography variant="body2" key={sc.receiver.address}>
            {sc.receiver.address}
            <br />
            {sc.amount}
          </Typography>
        ))}
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => buy(id, '0x13725351ef11f298')}>
          Buy
        </Button>
      </CardActions>
    </Card>
  );
}

export default Sale;
