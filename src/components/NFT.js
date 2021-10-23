import { CardActionArea } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';

function NFT({ address, id }) {
  const [metadata, setMetadata] = useState({});
  useEffect(() => {
    fcl
      .send([
        fcl.script(`
        import NonFungibleToken from 0xNonFungibleToken
        import OmuzeoItems from 0xOmuzeoItems

        pub struct AccountItem {
          pub let tokenId: UInt64
          pub let metadata: String
          pub let owner: Address

          init(tokenId: UInt64, metadata: String, owner: Address) {
            self.tokenId = tokenId
            self.metadata = metadata
            self.owner = owner
          }
        }

        pub fun main(address: Address, id: UInt64): AccountItem? {
          if let col = getAccount(address).getCapability<&OmuzeoItems.Collection{NonFungibleToken.CollectionPublic, OmuzeoItems.OmuzeoItemsCollectionPublic}>(OmuzeoItems.CollectionPublicPath).borrow() {
            if let item = col.borrowOmuzeoItem(id: id) {
              return AccountItem(tokenId: id, metadata: item.metadata, owner: address)
            }
          }

          return nil
        }`),
        fcl.args([fcl.arg(address, t.Address), fcl.arg(Number(id), t.UInt64)]),
      ])
      .then(fcl.decode)
      .then(setMetadata);
  }, [address, id]);
  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardActionArea>
        <CardMedia component="img" height="140" image={metadata.metadata} alt={metadata.tokenId} />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {metadata.tokenId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metadata.owner}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default NFT;
