import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';

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

function srcset(image, size, rows = 1, cols = 1) {
  return {
    src: `${image}?w=${size * cols}&h=${size * rows}&fit=crop&auto=format`,
    srcSet: `${image}?w=${size * cols}&h=${size * rows}&fit=crop&auto=format&dpr=2 2x`,
  };
}

const itemData = [
  {
    img: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e',
    title: 'Breakfast',
    rows: 2,
    cols: 2,
  },
  {
    img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d',
    title: 'Burger',
  },
  {
    img: 'https://images.unsplash.com/photo-1522770179533-24471fcdba45',
    title: 'Camera',
  },
  {
    img: 'https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c',
    title: 'Coffee',
    cols: 2,
  },
  {
    img: 'https://images.unsplash.com/photo-1533827432537-70133748f5c8',
    title: 'Hats',
    cols: 2,
  },
  {
    img: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62',
    title: 'Honey',
    author: '@arwinneil',
    rows: 2,
    cols: 2,
  },
  {
    img: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6',
    title: 'Basketball',
  },
  {
    img: 'https://images.unsplash.com/photo-1518756131217-31eb79b20e8f',
    title: 'Fern',
  },
  {
    img: 'https://images.unsplash.com/photo-1597645587822-e99fa5d45d25',
    title: 'Mushrooms',
    rows: 2,
    cols: 2,
  },
  {
    img: 'https://images.unsplash.com/photo-1567306301408-9b74779a11af',
    title: 'Tomato basil',
  },
  {
    img: 'https://images.unsplash.com/photo-1471357674240-e1a485acb3e1',
    title: 'Sea star',
  },
  {
    img: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6',
    title: 'Bike',
    cols: 2,
  },
];

const Artworks = () => {
  const { user } = useContext(AuthContext);

  const [value, setValue] = React.useState(0);

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
    return (
      <ImageList variant="quilted" cols={4} rowHeight={121}>
        {itemData.map((item) => (
          <ImageListItem key={item.img} cols={item.cols || 1} rows={item.rows || 1}>
            <img {...srcset(item.img, 121, item.rows, item.cols)} alt={item.title} loading="lazy" />
          </ImageListItem>
        ))}
      </ImageList>
    );
  };

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Create an artwork" {...a11yProps(0)} />
          <Tab label="Show artworks" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {showMintForm()}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {showQuiltedImageList()}
      </TabPanel>
    </>
  );
};

export default Artworks;
