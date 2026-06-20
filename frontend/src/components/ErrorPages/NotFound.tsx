import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import SearchOffIcon from '@mui/icons-material/SearchOff';

const NotFound: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          textAlign: 'center',
          maxWidth: 500,
          width: '100%'
        }}
      >
        <SearchOffIcon 
          sx={{ 
            fontSize: 80, 
            color: 'text.secondary',
            mb: 2 
          }} 
        />
        
        <Typography variant="h3" component="h1" gutterBottom color="text.secondary">
          404
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Strona nie znaleziona
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Strona, której szukasz, nie istnieje lub została przeniesiona.
          Sprawdź adres URL lub wróć do strony głównej.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/"
          >
            Strona główna
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
          >
            Powrót
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotFound; 