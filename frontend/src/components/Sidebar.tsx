import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ArticleIcon from '@mui/icons-material/Article';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { logout } from '../store/slices/authSlice';
import type { RootState } from '../store';
import { useAppDispatch } from '../hooks/useAppDispatch';

const SIDEBAR_WIDTH = 200;

interface NavItem {
  label: string;
  icon: React.ReactElement;
  path: string;
}

const mainNavItems: NavItem[] = [
  { label: 'Home', icon: <HomeIcon />, path: '/' },
  { label: 'Crypto', icon: <ShowChartIcon />, path: '/crypto' },
  { label: 'News', icon: <ArticleIcon />, path: '/news' },
  { label: 'Profile', icon: <PersonOutlineIcon />, path: '/profile' },
];

const Sidebar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAdmin } = useSelector((state: RootState) => state.auth);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        py: 3,
        px: 1.5,
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 1.5, mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        {isMobile && (
          <IconButton
            onClick={() => setMobileOpen(false)}
            sx={{
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              width: 32,
              height: 32,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: '1.15rem',
              color: '#fff',
              lineHeight: 1.2,
            }}
          >
            Crypto App
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.7rem',
              letterSpacing: '0.3px',
            }}
          >
            Track & Calculate
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 0 }}>
        {mainNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  px: 2,
                  background: active
                    ? 'linear-gradient(90deg, #e91e8c 0%, #ff6ec7 100%)'
                    : 'transparent',
                  boxShadow: active
                    ? '0 4px 15px rgba(233, 30, 140, 0.3)'
                    : 'none',
                  '&:hover': {
                    background: active
                      ? 'linear-gradient(90deg, #e91e8c 0%, #ff6ec7 100%)'
                      : 'rgba(255, 255, 255, 0.06)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    minWidth: 36,
                    '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.88rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* Admin link */}
        {isAdmin && (
          <>
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick('/admin')}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  px: 2,
                  background: isActive('/admin')
                    ? 'linear-gradient(90deg, #e91e8c 0%, #ff6ec7 100%)'
                    : 'transparent',
                  '&:hover': {
                    background: isActive('/admin')
                      ? 'linear-gradient(90deg, #e91e8c 0%, #ff6ec7 100%)'
                      : 'rgba(255, 255, 255, 0.06)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive('/admin') ? '#fff' : 'rgba(255,255,255,0.6)', minWidth: 36 }}>
                  <AdminPanelSettingsIcon sx={{ fontSize: '1.2rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Admin"
                  primaryTypographyProps={{
                    fontSize: '0.88rem',
                    fontWeight: isActive('/admin') ? 600 : 400,
                    color: isActive('/admin') ? '#fff' : 'rgba(255,255,255,0.7)',
                  }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick('/cart')}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  px: 2,
                  background: isActive('/cart')
                    ? 'linear-gradient(90deg, #e91e8c 0%, #ff6ec7 100%)'
                    : 'transparent',
                  '&:hover': {
                    background: isActive('/cart')
                      ? 'linear-gradient(90deg, #e91e8c 0%, #ff6ec7 100%)'
                      : 'rgba(255, 255, 255, 0.06)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive('/cart') ? '#fff' : 'rgba(255,255,255,0.6)', minWidth: 36 }}>
                  <ShoppingCartIcon sx={{ fontSize: '1.2rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Cart"
                  primaryTypographyProps={{
                    fontSize: '0.88rem',
                    fontWeight: isActive('/cart') ? 600 : 400,
                    color: isActive('/cart') ? '#fff' : 'rgba(255,255,255,0.7)',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>

      {/* Logout */}
      <Box sx={{ px: 0.5, mb: 1 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2.5,
            py: 1,
            px: 2,
            '&:hover': { background: 'rgba(255, 82, 82, 0.1)' },
          }}
        >
          <ListItemIcon sx={{ color: 'rgba(255,255,255,0.5)', minWidth: 36 }}>
            <LogoutIcon sx={{ fontSize: '1.2rem' }} />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.5)',
            }}
          />
        </ListItemButton>
      </Box>

      {/* Market Status */}
      <Box
        sx={{
          mx: 0.5,
          p: 1.5,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, rgba(233, 30, 140, 0.15) 0%, rgba(124, 77, 255, 0.1) 100%)',
          border: '1px solid rgba(233, 30, 140, 0.15)',
        }}
      >
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
          Market Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mt: 0.3 }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: '#00e676',
              boxShadow: '0 0 6px rgba(0, 230, 118, 0.6)',
            }}
          />
          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>
            Live Trading
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      {isMobile && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            width: 42,
            height: 42,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 1200,
            background: 'linear-gradient(180deg, rgba(26, 5, 51, 0.95) 0%, rgba(45, 27, 78, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH + 40,
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export { SIDEBAR_WIDTH };
export default Sidebar;
