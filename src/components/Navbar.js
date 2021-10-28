import { Logout } from '@mui/icons-material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { Divider, ListItemIcon, Menu, MenuItem } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import OmuzeoLogo from './omuzeo-logo-name.png';

const useStyles = makeStyles((theme) => ({
  navLinks: {
    marginRight: theme.spacing(2),
  },
  link: {
    textDecoration: 'none',
    color: '#ff00ab',
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: '20px',
    marginRight: theme.spacing(20),
    '&:hover': {
      color: 'black',
      borderBottom: '1px solid white',
    },
  },
  title: {
    flexGrow: 1,
  },
}));

const Navbar = () => {
  const { user, hasCollection, activateCollection, logIn, logOut } = useContext(AuthContext);
  const classes = useStyles();

  const [anchorEl, setAnchorEl] = useState(null);
  const [balance, setBalance] = useState(null);
  const openUser = Boolean(anchorEl);

  useEffect(() => {
    async function fetchData(address) {
      try {
        fcl
          .send([
            fcl.script(`
                  import FungibleToken from 0xFungibleToken
                  import FlowToken from 0xFlowToken

                  pub fun main(address: Address): UFix64 {
                    let vaultRef = getAccount(address).getCapability(/public/flowTokenBalance).borrow<&FlowToken.Vault{FungibleToken.Balance}>()
                      ?? panic("Could not borrow Balance reference to the Vault");
                    return vaultRef.balance;
                  }
                `),
            fcl.args([fcl.arg(address, t.Address)]),
          ])
          .then(fcl.decode)
          .then(setBalance);
      } catch (error) {
        console.log(error);
      }
    }
    if (user.addr) {
      fetchData(user.addr);
    }
  }, [user.addr]);

  const handleClickUser = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseUser = () => {
    setAnchorEl(null);
  };

  const showSignUpButton = () => (
    <Button color="primary" variant="contained" onClick={logIn}>
      Sign Up / Log In
    </Button>
  );

  const showUserIcon = () => (
    <IconButton edge="start" color="primary" aria-label="menu" className={classes.navLinks} onClick={handleClickUser}>
      <AccountCircleOutlinedIcon />
    </IconButton>
  );

  const showAccountDropdown = () => (
    <Menu
      anchorEl={anchorEl}
      open={openUser}
      onClose={handleCloseUser}
      onClick={handleCloseUser}
      PaperProps={{
        elevation: 0,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem component={Link} to="/account">
        {user.addr}
      </MenuItem>
      {user?.loggedIn && <MenuItem>{balance === null ? 'loading...' : `${balance} FLOW`}</MenuItem>}
      {user?.loggedIn && !hasCollection && <MenuItem onClick={activateCollection}>Activate Collection</MenuItem>}
      <Divider />
      <MenuItem onClick={logOut}>
        <ListItemIcon>
          <Logout fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
    </Menu>
  );

  return (
    <AppBar position="static">
      <Toolbar style={{ backgroundColor: 'white' }}>
        <img src={OmuzeoLogo} alt="Omuzeo Logo" height={50} width="auto" style={{ marginRight: '20px' }} />
        <Typography variant="h6" className={classes.title}>
          <div className={classes.navLinks}>
            <Link to="/" className={classes.link}>
              Home
            </Link>
            <Link to="/nfts" className={classes.link}>
              NFTs
            </Link>
            <Link to="/marketplace" className={classes.link}>
              Marketplace
            </Link>
            <Link to="/sales" className={classes.link}>
              Sales
            </Link>
          </div>
        </Typography>

        {!user?.loggedIn ? showSignUpButton() : showUserIcon()}
        {showAccountDropdown()}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
