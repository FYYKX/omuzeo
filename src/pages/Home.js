import React, { useState } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { Search } from '@mui/icons-material';
import QuiltedImageList from "../components/QuiltedImageList";

const Home = () => {
  const [searchText, setSearchText] = useState('');

  const handleSearchTextChange = (evt) => {
    setSearchText(evt.target.value);
  };

  const handleSearchTextEnter = (evt) => {
    if (evt.keyCode === 13) {
      // TODO: send api request to backend!
    }
  };

  const handleSearchTextClick = (evt) => {
    // TODO: send api request to backend!
  };

  return (
    <>
      <br />
      <TextField
        fullWidth
        label="Search"
        value={searchText}
        onChange={handleSearchTextChange}
        onKeyUp={handleSearchTextEnter}
        onClick={handleSearchTextClick}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton>
                <Search />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <br />
      <QuiltedImageList />
    </>
  );
};

export default Home;
