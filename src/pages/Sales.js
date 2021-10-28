import { Container, Grid } from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import Sale from '../components/Sale';

function Sales() {
  const { user } = useContext(AuthContext);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    async function fetchData(address) {
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
        .then((ids) =>
          ids.map((id) => {
            return {
              id: id,
              address: address,
            };
          }),
        )
        .then(setSales)
        .catch(console.log);
    }
    if (user.addr) {
      fetchData(user.addr);
    }
  }, [user.addr]);

  if (!sales.length) {
    return <div>No Sales</div>;
  }
  return (
    <Container>
      <Grid container spacing={4}>
        {sales.map((sale, index) => (
          <Sale key={index} {...sale} />
        ))}
      </Grid>
    </Container>
  );
}

export default Sales;
