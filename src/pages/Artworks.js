import { Box, Tab, Tabs, Typography } from '@mui/material';
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
  const { user, isUserDataEmpty } = useContext(AuthContext);

  const [value, setValue] = React.useState(0);
  const [ids, setIDs] = useState([]);

  useEffect(() => {
    if(isUserDataEmpty) return

    try {
      fcl
        .send([
          fcl.script(`
        import NonFungibleToken from 0xNonFungibleToken
        import OmuzeoItems from 0xOmuzeoItems

        pub fun main(address: Address): [UInt64] {
          let account = getAccount(address)
          let collectionRef = account.getCapability(OmuzeoItems.CollectionPublicPath)!.borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not borrow capability from public collection")
          return collectionRef.getIDs()
        }`),
          fcl.args([fcl.arg(user.addr, t.Address)]),
        ])
        .then(fcl.decode)
        .then((id) => id.sort((a, b) => a - b))
        .then(setIDs);
    } catch (error) {
      console.log(error);
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

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Create an artwork" {...a11yProps(0)} />
          <Tab label="Show artworks" {...a11yProps(1)} />
          <Tab label="Show ids" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {showMintForm()}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {showQuiltedImageList()}
      </TabPanel>
      <TabPanel value={value} index={2}>
        {ids.map((id) => (
          <NFT key={id} address={user.addr} id={id} />
        ))}
      </TabPanel>
    </>
  );
};

export default Artworks;
