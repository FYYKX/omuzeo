import { Alert, Card, CardContent, CardHeader, CircularProgress, Container, Grid, Typography } from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';

function Tickets() {
  const { user } = useContext(AuthContext);
  const [nft, setNFT] = useState({ isLoading: true });
  const [status, setStatus] = useState({ isLoading: false, error: '' });

  useEffect(() => {
    const fetchData = async (address) => {
      try {
        fcl
          .send([
            fcl.script(`
            import NonFungibleToken from 0xNonFungibleToken
            import OmuzeoNFT from 0xOmuzeoNFT

            pub fun main(address: Address, id: UInt64): OmuzeoNFT.Item {
              return OmuzeoNFT.fetch(address, itemID: id)
            }`),
            fcl.args([fcl.arg(address, t.Address), fcl.arg(Number(0), t.UInt64)]),
          ])
          .then(fcl.decode)
          .then((d) => {
            console.log(d);
            return d;
          })
          .then(setNFT);
      } catch (error) {
        console.log(error);
      }
    };
    if (user.addr) {
      fetchData(user.addr);
    }
  }, [user.addr]);

  if (!user.loggedIn || nft.isLoading) {
    return <CircularProgress />;
  }

  return (
    <Container>
      {status.error && <Alert severity="error">{status.error}</Alert>}
      <Grid container spacing={4}>
        {nft.tickets.map((t) => (
          <Grid item xs="auto" key={t}>
            <Card>
              <CardHeader title={nft.id} />
              <CardContent>
                <Typography>Creator: {nft.creator}</Typography>
                <Typography>Ticket {t}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Tickets;
