import React, { useState } from 'react';
import { Backdrop, CircularProgress, Stack, Typography } from '@mui/material';

export default function useTransactionProgress() {
  const [isTransactionInProgress, setIsTransactionInProgress] = useState(false);
  const [transactionStateMessage, setTransactionStateMessage] = useState('');

  const getTransactionProgressComponent = () => {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isTransactionInProgress}
        transitionDuration={{ exit: 2000 }}
      >
        <Stack justifyContent="center" alignItems="center">
          <CircularProgress color="inherit" />
          <br />
          <Typography variant="h4">{transactionStateMessage}</Typography>
        </Stack>
      </Backdrop>
    );
  };

  const setGenericTransactionMessageOnFailure = () =>
    setTransactionStateMessage('Something went wrong with the transaction. Try again perhaps?');

  const setGenericTransactionMessageOnLoading = () =>
    setTransactionStateMessage('Please wait. Sending data to the Flow blockchain...');

  const setGenericTransactionMessageOnSuccess = () => setTransactionStateMessage('Success!');

  return {
    setIsTransactionInProgress,
    setTransactionStateMessage,
    setGenericTransactionMessageOnFailure,
    setGenericTransactionMessageOnLoading,
    setGenericTransactionMessageOnSuccess,
    getTransactionProgressComponent,
  };
}
