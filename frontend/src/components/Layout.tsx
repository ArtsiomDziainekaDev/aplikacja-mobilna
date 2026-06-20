import React from 'react';
import { useSelector } from 'react-redux';
import { Outlet, Navigate } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import type { RootState } from '../store';

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
          p: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 8, md: 4 },
          minHeight: '100vh',
          maxWidth: isMobile ? '100%' : `calc(100% - ${SIDEBAR_WIDTH}px)`,
          transition: 'margin 0.3s ease',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;