import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/useAppDispatch';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Link
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { logout } from '../store/slices/authSlice';
import type { RootState } from '../store';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
          boxShadow: 3,
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Kantor Wymiany Walut
          </Typography>
          <Button color="inherit" component={RouterLink} to="/login">
            Zaloguj się
          </Button>
          <Button color="inherit" component={RouterLink} to="/register">
            Zarejestruj się
          </Button>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
        boxShadow: 3,
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link component={RouterLink} to="/" color="inherit" underline="none">
            Kantor Wymiany Walut
          </Link>
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isAdmin && (
            <Button color="inherit" component={RouterLink} to="/admin">
              Panel Administratora
            </Button>
          )}
          
          <Button
            color="inherit"
            component={RouterLink}
            to="/crypto"
            sx={{
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'translateY(-1px)' },
            }}
          >
            💰 Sprzedaj Krypto
          </Button>
          
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/orders"
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-1px)',
              },
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
            }}
            startIcon={<ListAltIcon />}
          >
            Moje zamówienia
          </Button>

          <IconButton 
            color="inherit" 
            component={RouterLink} 
            to="/cart"
            size="large"
          >
            <Badge badgeContent={items.length} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>

          <Button color="inherit" onClick={handleLogout}>
            Wyloguj
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 