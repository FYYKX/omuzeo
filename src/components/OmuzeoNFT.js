import { Button, Card, CardActions, CardContent, CardHeader, CircularProgress, Grid, Typography } from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';

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

  async function sell(ticketID, creator) {
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
        fcl.args([fcl.arg(Number(ticketID), t.UInt64), fcl.arg(String('10.0'), t.UFix64), fcl.arg(creator, t.Address)]),
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

  return (
    <Grid item xs={6}>
      <Card>
        <CardHeader title={metadata.id} />
        <CardContent>
          <Typography>{metadata.creator}</Typography>
          <Typography>{metadata.type}</Typography>
        </CardContent>
        <CardContent>
          {metadata.tickets.map((id) => (
            <Button variant="outlined" color="success" key={id} onClick={() => sell(id, metadata.creator)}>
              Sell Ticket {id}
            </Button>
          ))}
        </CardContent>
        <CardActions>
          <Button variant="contained" onClick={() => createTickets(5)}>
            Create 5 Tickets
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
}

export default OmuzeoNFT;
