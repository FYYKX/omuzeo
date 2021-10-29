import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';
import useTransactionProgress from '../hooks/useTransactionProgress';

function Sale({ address, id, currentUser }) {
  const [sale, setSale] = useState({ isLoading: true });
  const {
    setIsTransactionInProgress,
    getTransactionProgressComponent,
    setGenericTransactionMessageOnLoading,
    setGenericTransactionMessageOnFailure,
    setGenericTransactionMessageOnSuccess,
  } = useTransactionProgress();

  useEffect(() => {
    try {
      fcl
        .send([
          fcl.script(`
            import NFTStorefront from 0xNFTStorefront

            pub fun main(account: Address, listingResourceID: UInt64): NFTStorefront.ListingDetails {
              let storefrontRef = getAccount(account).getCapability<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(NFTStorefront.StorefrontPublicPath).borrow()
                ?? panic("Could not borrow public storefront from address")

              let listing = storefrontRef.borrowListing(listingResourceID: listingResourceID)
                ?? panic("No item with that ID")

              return listing.getDetails()
            }
          `),
          fcl.args([fcl.arg(address, t.Address), fcl.arg(Number(id), t.UInt64)]),
        ])
        .then(fcl.decode)
        .then((result) => {
          console.log(result);
          return result;
        })
        .then(setSale);
    } catch (error) {
      console.log(error);
    }
  }, [address, id]);

  async function buy() {
    setGenericTransactionMessageOnLoading();
    setIsTransactionInProgress(true);

    let txId, cdc;
    try {
      if (sale.nftType.endsWith('OmuzeoItems.NFT')) {
        cdc = `import FungibleToken from 0xFungibleToken
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
            self.storefront = getAccount(storefrontAddress).getCapability<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(NFTStorefront.StorefrontPublicPath)!.borrow()
              ?? panic("Could not borrow Storefront from provided address")

            self.listing = self.storefront.borrowListing(listingResourceID: listingResourceID)
              ?? panic("No Offer with that ID in Storefront")
            let price = self.listing.getDetails().salePrice

            let mainFlowVault = acct.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Cannot borrow FlowToken vault from acct storage")
            self.paymentVault <- mainFlowVault.withdraw(amount: price)

            self.omuzeoItemsCollection = acct.borrow<&OmuzeoItems.Collection{NonFungibleToken.Receiver}>(from: OmuzeoItems.CollectionStoragePath)
              ?? panic("Cannot borrow NFT collection receiver from account")
          }

          execute {
            let item <- self.listing.purchase(
              payment: <-self.paymentVault
            )

            self.omuzeoItemsCollection.deposit(token: <-item)
            self.storefront.cleanup(listingResourceID: listingResourceID)
          }
        }`;
      } else {
        cdc = `import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FlowToken from 0xFlowToken
        import OmuzeoNFT from 0xOmuzeoNFT
        import NFTStorefront from 0xNFTStorefront

        transaction(listingResourceID: UInt64, storefrontAddress: Address) {
          let paymentVault: @FungibleToken.Vault
          let omuzeoNFTCollection: &OmuzeoNFT.Collection{NonFungibleToken.Receiver}
          let storefront: &NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}
          let listing: &NFTStorefront.Listing{NFTStorefront.ListingPublic}

          prepare(acct: AuthAccount) {
            self.storefront = getAccount(storefrontAddress).getCapability<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(NFTStorefront.StorefrontPublicPath)!.borrow()
              ?? panic("Could not borrow Storefront from provided address")

            self.listing = self.storefront.borrowListing(listingResourceID: listingResourceID)
              ?? panic("No Offer with that ID in Storefront")
            let price = self.listing.getDetails().salePrice

            let mainFlowVault = acct.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Cannot borrow FlowToken vault from acct storage")
            self.paymentVault <- mainFlowVault.withdraw(amount: price)

            self.omuzeoNFTCollection = acct.borrow<&OmuzeoNFT.Collection{NonFungibleToken.Receiver}>(from: OmuzeoNFT.CollectionStoragePath)
              ?? panic("Cannot borrow NFT collection receiver from account")
          }

          execute {
            let item <- self.listing.purchase(
              payment: <-self.paymentVault
            )

            self.omuzeoNFTCollection.deposit(token: <-item)
            self.storefront.cleanup(listingResourceID: listingResourceID)
          }
        }`;
      }

      txId = await fcl.send([
        fcl.transaction(cdc),
        fcl.args([fcl.arg(Number(id), t.UInt64), fcl.arg(address, t.Address)]),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(1000),
      ]);
    } catch (error) {
      console.log(error);
      setGenericTransactionMessageOnFailure();
      setIsTransactionInProgress(false);
      return;
    }
    fcl.tx(txId).subscribe((tx) => {
      if (tx.errorMessage) {
        console.log(tx);
        setGenericTransactionMessageOnFailure();
        setIsTransactionInProgress(false);
        return;
      }
      if (fcl.tx.isSealed(tx)) {
        console.log('%cbuy success!', 'color: limegreen;');
        setGenericTransactionMessageOnSuccess();
        setIsTransactionInProgress(false);
      }
    });
  }

  if (sale.isLoading) {
    return <CircularProgress />;
  }

  const showNftsForSaleInDebugMode = () => (
    <Card>
      <CardHeader title={`Sale ID: ${id}`} />
      <CardContent>
        <Typography sx={{ mb: 5 }}>
          NFT ID: <Chip label={sale.nftID} color="primary" variant="outlined" />
        </Typography>
        <Typography sx={{ mb: 5 }}>
          Price: <Chip label={sale.salePrice} color="primary" variant="outlined" />
        </Typography>
        <Typography sx={{ mb: 5 }}>Details:</Typography>
        {sale.saleCuts?.map((sc, index) => (
          <Typography sx={{ mb: 5 }} key={index}>
            <Chip label={sc.receiver.address} color="primary" variant="outlined" />
            <Chip label={sc.amount} color="primary" variant="outlined" />
          </Typography>
        ))}
      </CardContent>
      {address !== currentUser && (
        <CardActions>
          <Button variant="contained" size="large" onClick={buy}>
            Buy
          </Button>
        </CardActions>
      )}
    </Card>
  );

  const addEntry = (label, value, index = -1) => (
    <Box sx={{ display: 'flex' }} style={{ marginBottom: '8px' }}>
      <Box style={{ minWidth: 100 }}>
        <Typography style={{ color: 'grey' }}>{`${label} `}</Typography>
      </Box>
      <Box>
        <Typography>{value}</Typography>
      </Box>
    </Box>
  );

  const showNftCardForSale = () => (
    <>
      <Box sx={{ height: 200 }}>
        <CardContent>
          <div style={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {addEntry('sales ID', id)}
                {sale.saleCuts?.map((sc, index) => (
                  <Box sx={{ display: 'flex' }} style={{ marginBottom: '8px' }} key={index}>
                    <Box style={{ minWidth: 100 }}>
                      <Typography style={{ color: 'grey' }}>{`creator `}</Typography>
                    </Box>
                    <Box>
                      <Typography>{`@${sc.receiver.address}`}</Typography>
                    </Box>
                  </Box>
                ))}
                {addEntry('identifier', sale.nftID)}
                {addEntry(
                  'price',
                  <Box>
                    <Typography variant="h4" display="inline">
                      {sale.salePrice.slice(0, -6)}
                    </Typography>
                    {'  '}
                    <Typography variant="caption" display="inline">
                      FLOW
                    </Typography>
                  </Box>,
                )}
              </Box>
              {/*  <Box>/!*TODO: What to place here?*!/</Box>*/}
            </Box>
          </div>
        </CardContent>
      </Box>
    </>
  );

  return (
    <Grid item>
      {getTransactionProgressComponent()}
      <Card sx={{ maxWidth: 350, padding: '10px' }}>
        {showNftCardForSale()}
        {address !== currentUser && (
          <CardActions>
            <Button variant="contained" size="large" onClick={buy}>
              Buy
            </Button>
          </CardActions>
        )}
      </Card>
    </Grid>
  );
}

export default Sale;
