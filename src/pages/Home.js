import { Grid, Typography } from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';
import Sale from '../components/Sale';
import { usePageLoadingProgress } from '../hooks/usePageLoadingProgress';

function Home() {
  const [sales, setSales] = useState([]);
  const { isPageLoading, setIsPageLoading } = usePageLoadingProgress();

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

    setIsPageLoading(true);

    Promise.all(['0xdedfcdfa108f79fc', '0x2dcfbf9769cd6fd6', '0x74dfbcc118666bd0'].map(fetchData))
      .then((s) => s.flat())
      .then(setSales)
      .catch(console.log)
      .finally(() => setIsPageLoading(false));
  }, []);

  if (isPageLoading) return <></>;

  if (!sales) {
    return <Typography variant="h4">No items for sale</Typography>;
  }

  return (
    <>
      <Typography variant="h4">Items for sale</Typography>
      <br />
      <Grid container spacing={15}>
        {sales.map((sale, index) => (
          <Grid item xs={4} key={index}>
            <Sale {...sale} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default Home;
