import FileUploadIcon from '@mui/icons-material/FileUpload';
import { Stack, TextField, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import axios from 'axios';
import React, { useContext, useState } from 'react';
import { AuthContext } from '../AuthContext';
import useTransactionProgress from '../hooks/useTransactionProgress';

function Create() {
  const { user } = useContext(AuthContext);
  const [nftArtTitle, setNftArtTitle] = useState(null);
  const [nftArtDescription, setNftArtDescription] = useState(null);
  const [nftArtImage, setNftArtImage] = useState(null);
  const { setTransactionStateMessage, setIsTransactionInProgress, getTransactionProgressComponent } =
    useTransactionProgress();
  const formWidth = 500;

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

  return (
    <>
      {getTransactionProgressComponent()}
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
}

export default Create;
