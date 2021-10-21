import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const Artworks = () => {
  const { user } = useContext(AuthContext);

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

  return (
    <>
      <div>Create an artwork</div>
      {showMintForm()}
    </>
  );
};

export default Artworks;
