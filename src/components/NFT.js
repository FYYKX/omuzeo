import { Box, Card, CardActionArea, CardContent, CardMedia, CircularProgress, Typography } from '@mui/material';
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
            pub let owner: Address
            pub let type: String

            init(id: UInt64, owner: Address, type: String) {
              self.id = id
              self.owner = owner
              self.type = type
            }
          }

          pub fun main(address: Address, id: UInt64): Item {
            let item = OmuzeoItems.fetch(address, itemID: id)
            return Item(id: item, owner: address, type: "OmuzeoItems")
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

  if (metadata.isLoading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardActionArea>
        {metadata.metadata && <CardMedia component="img" height="140" image={metadata.metadata} alt={metadata.id} />}
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            ID: {metadata.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metadata.owner || metadata.creator}
          </Typography>
          <Typography>{type}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default NFT;
