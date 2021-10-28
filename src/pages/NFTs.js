import { Backdrop, Box, CircularProgress, Grid, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import NFT from '../components/NFT';
import Button from '@mui/material/Button';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import useTransactionProgress from '../hooks/useTransactionProgress';

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

const NFTs = () => {
  const { user } = useContext(AuthContext);
  const [value, setValue] = React.useState(0);
  const [nfts, setNFTs] = useState({});

  const { setTransactionStateMessage, setIsTransactionInProgress, getTransactionProgressComponent } =
    useTransactionProgress();

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

  const [nftArtTitle, setNftArtTitle] = useState(null);
  const [nftArtDescription, setNftArtDescription] = useState(null);
  const [nftArtImage, setNftArtImage] = useState(null);

  const handleTitleChange = (evt) => {
    setNftArtTitle(evt.target.value);
    setTransactionStateMessage(null);
  };

  const handleDescriptionChange = (evt) => {
    setNftArtDescription(evt.target.value);
    setTransactionStateMessage(null);
  };

  const handleUpload = (evt) => {
    setNftArtImage(evt.target.files[0]);
    setTransactionStateMessage(null);
  };

  const handleSubmitForm = (evt) => {
    evt.preventDefault();

    setTransactionStateMessage('Please wait while we upload your image');
    setIsTransactionInProgress(true);

    const data = new FormData();
    data.append('receiver', user.addr);
    data.append('name', nftArtTitle);
    data.append('image', nftArtImage, nftArtTitle + '.jpg');

    axios
      .post('/create', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setTransactionStateMessage(`You've successfully uploaded ${nftArtTitle}!`);
        } else {
          setTransactionStateMessage('Something went wrong. Please try uploading again!');
        }
        console.log(response);
        setIsTransactionInProgress(false);
      })
      .catch((error) => {
        console.error(error);
        setTransactionStateMessage('Something went wrong. Please try uploading again!');
        setIsTransactionInProgress(false);
      });
  };

  const showMintForm = () => {
    const formWidth = 500;
    return (
      <>
        <br />
        <form onSubmit={handleSubmitForm}>
          <Stack>
            <TextField
              label="Title"
              value={nftArtTitle ? nftArtTitle : ''}
              onChange={handleTitleChange}
              size="small"
              required
              style={{ maxWidth: formWidth, marginBottom: '10px' }}
            />
            <TextField
              multiline
              label="Description"
              value={nftArtDescription ? nftArtDescription : ''}
              onChange={handleDescriptionChange}
              rows={4}
              maxRows={8}
              required
              style={{ maxWidth: formWidth, marginBottom: '10px' }}
            />
            <label htmlFor="upload-file" style={{ maxWidth: formWidth, marginBottom: '10px' }}>
              <input
                hidden
                id="upload-file"
                name="upload-file"
                type="file"
                // value={nftArtImage ? nftArtImage : ''}
                onChange={handleUpload}
              />
              <Button variant="outlined" component="span" style={{ minWidth: 150 }}>
                <FileUploadIcon />
                Upload file
              </Button>
              {'    '}
              <Typography variant="caption" style={{ color: 'grey' }}>
                {nftArtImage ? nftArtImage.name : ''}
              </Typography>
            </label>
            <Button variant="contained" type="submit" style={{ maxWidth: 150, marginBottom: '10px' }}>
              Submit
            </Button>
          </Stack>
        </form>
      </>
    );
  };

  function NFTList() {
    if (nfts.OmuzeoItems.length > 0 || nfts.OmuzeoNFT.length > 0) {
      return (
        <Grid container spacing={15}>
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
      {/*<Backdrop*/}
      {/*  sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}*/}
      {/*  open={isLoading}*/}
      {/*  transitionDuration={{ exit: 2000 }}*/}
      {/*>*/}
      {/*  <Stack justifyContent="center" alignItems="center">*/}
      {/*    <CircularProgress color="inherit" />*/}
      {/*    <br />*/}
      {/*    <Typography variant="h4">{uploadSuccessMsg}</Typography>*/}
      {/*  </Stack>*/}
      {/*</Backdrop>*/}
      {getTransactionProgressComponent()}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Create an NFT" {...a11yProps(0)} />
          <Tab label="View NFTs" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {showMintForm()}
      </TabPanel>
      <TabPanel value={value} index={1}>
        <br />
        <NFTList />
      </TabPanel>
    </>
  );
};

export default NFTs;
