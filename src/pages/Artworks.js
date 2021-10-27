import { Box, Grid, Tab, Tabs, Typography } from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import NFT from '../components/NFT';
import QuiltedImageList from '../components/QuiltedImageList';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const Artworks = () => {
  const { user } = useContext(AuthContext);
  const [value, setValue] = React.useState(0);
  const [nfts, setNFTs] = useState({});

  useEffect(() => {
    async function fetchData(address) {
      try {
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
                ret["OmuzeoItems"] = omuzeoItemsCollectionRef.getIDs()
                ret["OmuzeoNFT"] = omuzeoNFTcollectionRef.getIDs()
                return ret
              }`),
            fcl.args([fcl.arg(address, t.Address)]),
          ])
          .then(fcl.decode)
          .then(setNFTs);
      } catch (error) {
        console.log(error);
      }
    }
    if (user.addr) {
      fetchData(user.addr);
    }
  }, [user.addr]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [nftArtName, setNftArtName] = useState(null);
  const [nftArtImage, setNftArtImage] = useState(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState(null);

  const handleNameChange = (evt) => {
    setNftArtName(evt.target.value);
    setUploadSuccessMsg(null);
  };

  const handleUpload = (evt) => {
    setNftArtImage(evt.target.files[0]);
    setUploadSuccessMsg(null);
  };

  const handleSubmitForm = (evt) => {
    evt.preventDefault();

    const data = new FormData();
    data.append('receiver', user.addr);
    data.append('name', nftArtName);
    data.append('image', nftArtImage, nftArtName + '.jpg');

    setUploadSuccessMsg('Please wait while we upload your image');

    axios
      .post('/create', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setUploadSuccessMsg(`You've successfully uploaded ${nftArtName}!`);
        } else {
          setUploadSuccessMsg('Something went wrong. Please try uploading again!');
        }
        console.log(response);
      })
      .catch((error) => {
        console.error(error);
        setUploadSuccessMsg('Something went wrong. Please try uploading again!');
      });
  };

  const showMintForm = () => {
    return (
      <>
        <form onSubmit={handleSubmitForm}>
          <input type="text" onChange={handleNameChange} placeholder="Name" />
          <br />
          <input type="file" onChange={handleUpload} />
          <br />
          <input type="submit" />
        </form>
        <br />
        {uploadSuccessMsg ? <span>{uploadSuccessMsg}</span> : null}
      </>
    );
  };

  const showQuiltedImageList = () => {
    return <QuiltedImageList />;
  };

  function NFTList() {
    if (nfts.OmuzeoItems.length > 0 || nfts.OmuzeoNFT.length > 0) {
      return (
        <Grid container>
          {nfts.OmuzeoItems.map((id) => (
            <Grid item xs={4} key={id}>
              <NFT address={user.addr} id={id} type="OmuzeoItems.NFT" />
            </Grid>
          ))}
          {nfts.OmuzeoNFT.map((id) => (
            <Grid item xs={4} key={id}>
              <NFT address={user.addr} id={id} type="OmuzeoNFT.NFT" />
            </Grid>
          ))}
        </Grid>
      );
    } else {
      return <div>No NFTs</div>;
    }
  }

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Create an artwork" {...a11yProps(0)} />
          <Tab label="Show artworks" {...a11yProps(1)} />
          <Tab label="Show NFTs" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {showMintForm()}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {showQuiltedImageList()}
      </TabPanel>
      <TabPanel value={value} index={2}>
        <NFTList />
      </TabPanel>
    </>
  );
};

export default Artworks;
