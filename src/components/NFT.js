import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  Typography,
} from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';

function NFT({ address, id, type }) {
  const [metadata, setMetadata] = useState({ isLoading: true });
  useEffect(() => {
    try {
      let cdc;
      if (type.endsWith('OmuzeoNFT.NFT')) {
        cdc = `import NonFungibleToken from 0xNonFungibleToken
        import OmuzeoNFT from 0xOmuzeoNFT

        pub fun main(address: Address, id: UInt64): OmuzeoNFT.Item {
          return OmuzeoNFT.fetch(address, itemID: id)
        }`;
      } else {
        cdc = `import NonFungibleToken from 0xNonFungibleToken
          import OmuzeoItems from 0xOmuzeoItems

          pub struct Item {
            pub let id: UInt64
            pub let metadata: String
            pub let owner: Address
            pub let type: String

            init(id: UInt64, metadata: String, owner: Address, type: String) {
              self.id = id
              self.metadata = metadata
              self.owner = owner
              self.type = type
            }
          }

          pub fun main(address: Address, id: UInt64): Item {
            let item = OmuzeoItems.fetch(address, itemID: id)!
            return Item(id: item.id, metadata: item.metadata, owner: address, type: "OmuzeoItems")
          }`;
      }
      fcl
        .send([fcl.script(cdc), fcl.args([fcl.arg(address, t.Address), fcl.arg(Number(id), t.UInt64)])])
        .then(fcl.decode)
        .then(setMetadata);
    } catch (error) {
      console.log(error);
    }
  }, [address, id, type]);

  async function view() {
    setMetadata({
      ...metadata,
      isLoading: true,
    });
    let txId;
    try {
      txId = await fcl.send([
        fcl.transaction(`
        import NonFungibleToken from 0xNonFungibleToken
        import OmuzeoNFT from 0xOmuzeoNFT

        transaction(id: UInt64) {
          let collection: &OmuzeoNFT.Collection

          prepare(signer: AuthAccount) {
            self.collection = signer.borrow<&OmuzeoNFT.Collection>(from: OmuzeoNFT.CollectionStoragePath)
              ?? panic("Could not borrow a reference to the collection")
          }

          execute {
            self.collection.borrowMetadata(id: id)
          }
        }`),
        fcl.args([fcl.arg(Number(id), t.UInt64)]),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(100),
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
        console.log(tx);
        const { data } = tx.events.find((e) => e.type.includes('OmuzeoNFT.View'));

        setMetadata({
          ...metadata,
          metadata: data.metadata,
        });
      }
    });
  }

  if (metadata.isLoading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader title={metadata.id} />
      {metadata.metadata && <CardMedia component="img" height="140" image={metadata.metadata} alt={metadata.id} />}
      <CardContent>
        <Typography>{metadata.owner || metadata.creator}</Typography>
        <Button variant="contained" color={type === 'OmuzeoNFT.NFT' ? 'primary' : 'success'}>
          {type}
        </Button>
        <Button variant="outlined" color={metadata.type === 'creator' ? 'primary' : 'info'}>
          {metadata.type}
        </Button>
      </CardContent>
      {metadata.type === 'owner' && (
        <CardActions>
          <Button onClick={view}>View</Button>
        </CardActions>
      )}
    </Card>
  );
}

export default NFT;
