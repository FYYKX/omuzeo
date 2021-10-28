import { Container, Grid, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import Sale from '../components/Sale';
import { CREATOR_ADDRESS } from '../DemoConstants';

/*
Displays the NFTs for sale.
For this hackathon, display only the creator and fan nft
 */
const Home = () => {
  const address = CREATOR_ADDRESS;
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

  return (
      <Grid container>
        {sales.length ? (
          <>
            <Typography variant="h4">Items you may like</Typography>
            {sales.map((id) => (
              <Sale key={id} address={address} id={id} />
            ))}
          </>
        ) : (
          <Typography variant="h4">No items for sale</Typography>
        )}
      </Grid>
  );
};

export default Home;
