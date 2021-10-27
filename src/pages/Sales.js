import { Container, Grid } from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';
import Sale from '../components/Sale';

function Sales() {
  const address = '0x154880e843e25e08';
  const [sales, setSales] = useState([]);

  useEffect(() => {
    try {
      fcl
        .send([
          fcl.script(`
              import NFTStorefront from 0xNFTStorefront

              pub fun main(account: Address): [UInt64] {
                let storefrontRef = getAccount(account).getCapability<&NFTStorefront.Storefront{NFTStorefront.StorefrontPublic}>(NFTStorefront.StorefrontPublicPath).borrow()
                  ?? panic("Could not borrow public storefront from address")

                return storefrontRef.getListingIDs()
              }
            `),
          fcl.args([fcl.arg(address, t.Address)]),
        ])
        .then(fcl.decode)
        .then(setSales);
    } catch (error) {
      console.log(error);
    }
  }, []);

  if (!sales.length) {
    return <div>No Sales</div>;
  }
  return (
    <Container>
      <Grid container spacing={4}>
        {sales.map((id) => (
          <Sale key={id} address={address} id={id} />
        ))}
      </Grid>
    </Container>
  );
}

export default Sales;
