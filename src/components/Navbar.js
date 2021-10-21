import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { makeStyles } from '@mui/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { Link } from 'react-router-dom';
import { Avatar, Divider, ListItemIcon, MenuItem, Menu } from '@mui/material';
import { Logout } from '@mui/icons-material';

const useStyles = makeStyles((theme) => ({
  navLinks: {
    marginRight: theme.spacing(2),
  },
  link: {
    textDecoration: 'none',
    color: 'white',
    fontSize: '20px',
    marginRight: theme.spacing(20),
    '&:hover': {
      color: 'yellow',
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
  const openUser = Boolean(anchorEl);

  const handleClickUser = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseUser = () => {
    setAnchorEl(null);
  };

  const showSignUpButton = () => (
    <Button color="inherit" onClick={logIn}>
      Sign Up / Log In
    </Button>
  );

  const showUserIcon = () => (
    <IconButton edge="start" color="inherit" aria-label="menu" className={classes.navLinks} onClick={handleClickUser}>
      <AccountCircleOutlinedIcon />
    </IconButton>
  );

  const showActivateCollectionButton = () => <button onClick={activateCollection}>Activate Collection</button>;

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
      <MenuItem component={Link} to="/profile">
        <Avatar /> Profile
      </MenuItem>
      <MenuItem component={Link} to="/account">
        <Avatar /> My account
      </MenuItem>
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
      <Toolbar>
        <Typography variant="h6" className={classes.title}>
          <div className={classes.navLinks}>
            <Link to="/" className={classes.link}>
              Home
            </Link>
            <Link to="/artworks" className={classes.link}>
              Artworks
            </Link>
            <Link to="/collections" className={classes.link}>
              Collections
            </Link>
            <Link to="/messages" className={classes.link}>
              Messages
            </Link>
          </div>
        </Typography>

        {user?.loggedIn && !hasCollection && showActivateCollectionButton()}
        {!user?.loggedIn ? showSignUpButton() : showUserIcon()}
        {showAccountDropdown()}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
