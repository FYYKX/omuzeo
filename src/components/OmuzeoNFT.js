import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';
import LockedContent from '../assets/locked-item.png';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

function OmuzeoNFT({ address, id }) {
  const [metadata, setMetadata] = useState({ isLoading: true });
  useEffect(() => {
    try {
      fcl
        .send([
          fcl.script(`
          import NonFungibleToken from 0xNonFungibleToken
          import OmuzeoNFT from 0xOmuzeoNFT

          pub fun main(address: Address, id: UInt64): OmuzeoNFT.Item {
            return OmuzeoNFT.fetch(address, itemID: id)
          }`),
          fcl.args([fcl.arg(address, t.Address), fcl.arg(Number(id), t.UInt64)]),
        ])
        .then(fcl.decode)
        .then(setMetadata);
    } catch (error) {
      console.log(error);
    }
  }, [address, id]);

  async function createTickets(total) {
    let txId;
    try {
      txId = await fcl.send([
        fcl.transaction(`
          import NonFungibleToken from 0xNonFungibleToken
          import OmuzeoNFT from 0xOmuzeoNFT

          transaction(id: UInt64, total: UInt64) {
            let collectionRef: &OmuzeoNFT.Collection

            prepare(acct: AuthAccount) {
              self.collectionRef = acct.borrow<&OmuzeoNFT.Collection>(from: OmuzeoNFT.CollectionStoragePath)!
            }

            execute {
              self.collectionRef.createTickets(id: id, total: total)
              log("create tickets")
            }
          }
        `),
        fcl.args([fcl.arg(Number(id), t.UInt64), fcl.arg(Number(total), t.UInt64)]),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(1000),
      ]);
    } catch (error) {
      return;
    }

    fcl.tx(txId).subscribe((tx) => {
      if (tx.errorMessage) {
        console.log(tx);
        return;
      }
      if (fcl.tx.isSealed(tx)) {
        console.log('%ccreate ticket success!', 'color: limegreen;');
      }
    });
  }

  async function sellTicket(ticketID, price, creator) {
    let txId;
    try {
      txId = await fcl.send([
        fcl.transaction(`
        import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FlowToken from 0xFlowToken
        import OmuzeoNFT from 0xOmuzeoNFT
        import NFTStorefront from 0xNFTStorefront

        transaction(saleItemID: UInt64, saleItemPrice: UFix64, creator: Address) {
          let owner: Capability<&FlowToken.Vault{FungibleToken.Receiver}>
          let creator: Capability<&FlowToken.Vault{FungibleToken.Receiver}>
          let omuzeoNFTProvider: Capability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>
          let storefront: &NFTStorefront.Storefront

          prepare(acct: AuthAccount) {
            let omuzeoNFTCollectionProviderPrivatePath = /private/OmuzeoNFTCollectionProviderForNFTStorefront

            self.owner = acct.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            assert(self.owner.borrow() != nil, message: "Missing or mis-typed FlowToken receiver")

            self.creator = getAccount(creator).getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            assert(self.creator.borrow() != nil, message: "Missing or mis-typed FlowToken receiver")

            if !acct.getCapability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath)!.check() {
              acct.link<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath, target: OmuzeoNFT.CollectionStoragePath)
            }

            self.omuzeoNFTProvider = acct.getCapability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath)!
            assert(self.omuzeoNFTProvider.borrow() != nil, message: "Missing or mis-typed OmuzeoNFT.Collection provider")

            self.storefront = acct.borrow<&NFTStorefront.Storefront>(from: NFTStorefront.StorefrontStoragePath)
              ?? panic("Missing or mis-typed NFTStorefront Storefront")
          }

          execute {
            let ownerSaleCut = NFTStorefront.SaleCut(
              receiver: self.owner,
              amount: saleItemPrice * 0.7
            )
            let creatorSaleCut = NFTStorefront.SaleCut(
              receiver: self.creator,
              amount: saleItemPrice * 0.3
            )
            self.storefront.createListing(
              nftProviderCapability: self.omuzeoNFTProvider,
              nftType: Type<@OmuzeoNFT.NFT>(),
              nftID: saleItemID,
              salePaymentVaultType: Type<@FlowToken.Vault>(),
              saleCuts: [ownerSaleCut, creatorSaleCut]
            )
          }
        }`),
        fcl.args([
          fcl.arg(Number(ticketID), t.UInt64),
          fcl.arg(price.toFixed(2), t.UFix64),
          fcl.arg(creator, t.Address),
        ]),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(1000),
      ]);
    } catch (error) {
      console.log(error);
      return;
    }

    fcl.tx(txId).subscribe((tx) => {
      if (tx.errorMessage) {
        console.log(tx);
        return;
      }
      if (fcl.tx.isSealed(tx)) {
        console.log('%clisting ticket success!', 'color: limegreen;');
      }
    });
  }

  async function sell(id, price) {
    let txId;
    try {
      txId = await fcl.send([
        fcl.transaction(`
        import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FlowToken from 0xFlowToken
        import OmuzeoNFT from 0xOmuzeoNFT
        import NFTStorefront from 0xNFTStorefront

        transaction(saleItemID: UInt64, saleItemPrice: UFix64) {
          let flowReceiver: Capability<&FlowToken.Vault{FungibleToken.Receiver}>
          let omuzeoNFTProvider: Capability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>
          let storefront: &NFTStorefront.Storefront

          prepare(acct: AuthAccount) {
            let omuzeoNFTCollectionProviderPrivatePath = /private/OmuzeoNFTCollectionProviderForNFTStorefront

            self.flowReceiver = acct.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            assert(self.flowReceiver.borrow() != nil, message: "Missing or mis-typed FlowToken receiver")

            if !acct.getCapability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath)!.check() {
              acct.link<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath, target: OmuzeoNFT.CollectionStoragePath)
            }

            self.omuzeoNFTProvider = acct.getCapability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath)!
            assert(self.omuzeoNFTProvider.borrow() != nil, message: "Missing or mis-typed OmuzeoNFT.Collection provider")

            self.storefront = acct.borrow<&NFTStorefront.Storefront>(from: NFTStorefront.StorefrontStoragePath)
              ?? panic("Missing or mis-typed NFTStorefront Storefront")
          }

          execute {
            let saleCut = NFTStorefront.SaleCut(
              receiver: self.flowReceiver,
              amount: saleItemPrice
            )
            self.storefront.createListing(
              nftProviderCapability: self.omuzeoNFTProvider,
              nftType: Type<@OmuzeoNFT.NFT>(),
              nftID: saleItemID,
              salePaymentVaultType: Type<@FlowToken.Vault>(),
              saleCuts: [saleCut]
            )
          }
        }`),
        fcl.args([fcl.arg(Number(id), t.UInt64), fcl.arg(price.toFixed(2), t.UFix64)]),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(1000),
      ]);
    } catch (error) {
      console.log(error);
      return;
    }

    fcl.tx(txId).subscribe((tx) => {
      if (tx.errorMessage) {
        console.log(tx);
        return;
      }
      if (fcl.tx.isSealed(tx)) {
        console.log('%clisting ticket success!', 'color: limegreen;');
      }
    });
  }

  if (metadata.isLoading) {
    return <CircularProgress />;
  }

  if (metadata.type === 'owner') {
    return <></>;
  }

  const showImageAndInfo = () => {
    return (
      <>
        <CardMedia component="img" image={LockedContent} alt="Locked content" />
        <CardContent>
          <div style={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box style={{ marginBottom: '8px' }}>
                  <Typography style={{ color: 'grey' }}>{`${metadata.type} `}</Typography>
                  <Typography>@{metadata.creator}</Typography>
                </Box>
                <Box style={{ marginBottom: '18px' }}>
                  <Typography style={{ color: 'grey', fontSize: '12px' }}>{`IDENTIFIER ${metadata.id}`}</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" display="inline">{`${(20).toFixed(2)}`}</Typography>
                  {'  '}
                  <Typography variant="caption" display="inline">
                    FLOW
                  </Typography>
                </Box>
              </Box>
              <Box>
                {/*TODO: Implement likes feature*/}
                <FavoriteBorderIcon fontSize="small" style={{ color: 'grey' }} />
              </Box>
            </Box>
          </div>
        </CardContent>
      </>
    );
  };

  return (
    <Grid item xs={4}>
      <Card sx={{ maxWidth: 270, padding: '10px' }}>
        {showImageAndInfo()}
        {address !== metadata.creator && (
          <CardContent>
            {metadata.tickets.map((id) => (
              <Button variant="outlined" color="success" key={id} onClick={() => sellTicket(id, 10, metadata.creator)}>
                Sell Ticket {id} with 10 Flows
              </Button>
            ))}
          </CardContent>
        )}
        <CardActions>
          {address !== metadata.creator && (
            <Button variant="contained" onClick={() => createTickets(5)}>
              Create 5 Tickets
            </Button>
          )}
          <Button variant="contained" onClick={() => sell(id, 11)}>
            Sell with 20 Flows
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
}

export default OmuzeoNFT;
