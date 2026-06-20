import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import BlockIcon from '@mui/icons-material/Block';

const Forbidden: React.FC = () => {
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
        <BlockIcon 
          sx={{ 
            fontSize: 80, 
            color: 'error.main',
            mb: 2 
          }} 
        />
        
        <Typography variant="h3" component="h1" gutterBottom color="error">
          403
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Brak dostępu
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Nie masz uprawnień do przeglądania tej strony.
          Skontaktuj się z administratorem, jeśli uważasz, że to błąd.
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

export default Forbidden; 