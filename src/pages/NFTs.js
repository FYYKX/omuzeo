import { Grid } from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import NFT from '../components/NFT';

const NFTs = () => {
  const { user } = useContext(AuthContext);
  const [nfts, setNFTs] = useState(null);

  useEffect(() => {
    function fetchData(address) {
      fcl
        .send([
          fcl.script(`
              import NonFungibleToken from 0xNonFungibleToken
              import OmuzeoItems from 0xOmuzeoItems
              import OmuzeoNFT from 0xOmuzeoNFT

              pub fun main(address: Address): {String: [UInt64]} {
                let account = getAccount(address)
                let omuzeoItemsCollectionRef = account.getCapability(OmuzeoItems.CollectionPublicPath)!.borrow<&{NonFungibleToken.CollectionPublic}>()
                  ?? panic("Could not borrow OmuzeoItems capability from public collection")

                let omuzeoNFTcollectionRef = account.getCapability(OmuzeoNFT.CollectionPublicPath)!.borrow<&{NonFungibleToken.CollectionPublic}>()
                  ?? panic("Could not borrow OmuzeoNFT capability from public collection")

                let ret: {String: [UInt64]} = {}
                ret["OmuzeoItems.NFT"] = omuzeoItemsCollectionRef.getIDs()
                ret["OmuzeoNFT.NFT"] = omuzeoNFTcollectionRef.getIDs()
                return ret
              }`),
          fcl.args([fcl.arg(address, t.Address)]),
        ])
        .then(fcl.decode)
        .then((result) => {
          return Object.entries(result).flatMap(([key, value]) => {
            return value.map((item) => {
              return {
                type: key,
                id: item,
                address: address,
              };
            });
          });
        })
        .then((result) => {
          console.log(result);
          return result;
        })
        .then(setNFTs)
        .catch(console.log);
    }

    if (user.addr) {
      fetchData(user.addr);
    }
  }, [user.addr]);

  if (!nfts) {
    return <div>No NFTs</div>;
  }

  return (
    <Grid container spacing={15}>
      {nfts.map((nft, index) => (
        <Grid item xs={4} key={index}>
          <NFT {...nft} />
        </Grid>
      ))}
    </Grid>
  );
};

export default NFTs;
