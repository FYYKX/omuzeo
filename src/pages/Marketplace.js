import { CircularProgress, Container, Grid } from '@mui/material';
import { Box } from '@mui/system';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import OmuzeoNFT from '../components/OmuzeoNFT';

function Marketplace() {
  const { user } = useContext(AuthContext);
  const [ids, setIDs] = useState([]);

  useEffect(() => {
    const fetchData = async (address) => {
      try {
        fcl
          .send([
            fcl.script(`
              import NonFungibleToken from 0xNonFungibleToken
              import OmuzeoNFT from 0xOmuzeoNFT

              pub fun main(address: Address): [UInt64] {
                let account = getAccount(address)
                let collectionRef = account.getCapability(OmuzeoNFT.CollectionPublicPath)!.borrow<&{NonFungibleToken.CollectionPublic}>()
                  ?? panic("Could not borrow capability from public collection")
                return collectionRef.getIDs()
              }`),
            fcl.args([fcl.arg(address, t.Address)]),
          ])
          .then(fcl.decode)
          .then((id) => id.sort((a, b) => a - b))
          .then(setIDs);
      } catch (error) {
        console.log(error);
      }
    };
    if (user.addr) {
      fetchData(user.addr);
    }
  }, [user.addr]);

  if (!user.loggedIn) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Grid container spacing={15}>
      {ids.map((id) => (
        <OmuzeoNFT key={id} address={user.addr} id={id} />
      ))}
    </Grid>
  );
}

export default Marketplace;
