import { Grid, Typography } from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';
import Sale from '../components/Sale';

function Home() {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    async function fetchData(address) {
      return fcl
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
        .then((ids) =>
          ids.map((id) => {
            return {
              id: id,
              address: address,
            };
          }),
        )
        .catch(console.log);
    }
    Promise.all(['0xdedfcdfa108f79fc', '0x2dcfbf9769cd6fd6'].map(fetchData))
      .then((s) => s.flat())
      .then(setSales)
      .catch(console.log);
  }, []);

  return (
    <>
      <Typography variant="h4">Items for sale</Typography>
      <br />
      <Grid container>
        <br />
        {sales.length ? (
          <>
            {sales.map((sale, index) => (
              <Sale key={index} {...sale} />
            ))}
          </>
        ) : (
          <Typography variant="h4">No items for sale</Typography>
        )}
      </Grid>
    </>
  );
}

export default Home;
