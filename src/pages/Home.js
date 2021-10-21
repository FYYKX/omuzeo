import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Stack, TextField } from '@mui/material';
import Button from '@mui/material/Button';

function Item(props) {
  const { sx, ...other } = props;
  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        p: 1,
        borderRadius: 1,
        textAlign: 'center',
        fontSize: 19,
        fontWeight: '700',
        ...sx,
      }}
      {...other}
    />
  );
}

const Home = () => {
  return (
    <>
      <div style={{ width: '100%' }}>
        <Box
          sx={{
            display: 'grid',
            gridAutoColumns: '1fr',
            gap: 1,
          }}
        >
          <Item sx={{ gridRow: '1', gridColumn: 'span 2' }}>span 2</Item>
          {/* The second non-visible column has width of 1/4 */}
          <Item sx={{ gridRow: '1', gridColumn: '4 / 5' }}>4 / 5</Item>
        </Box>
        <Stack direction="row">
          <TextField placeholder="Search" style={{minWidth: 500}}/>
          <Button onClick={() => {}}>
            <SearchIcon />
          </Button>
        </Stack>
        <Box sx={{ display: 'flex', p: 1, bgcolor: 'background.paper' }}>
          <Box sx={{ p: 1, flexGrow: 1, bgcolor: 'grey.300' }}>
            {' '}
            <TextField placeholder="Search" />
          </Box>
          <Box sx={{ p: 1, bgcolor: 'grey.300' }}>
            <Button onClick={() => {}}>
              <SearchIcon />
            </Button>
          </Box>
        </Box>
      </div>
    </>
  );
};

export default Home;
