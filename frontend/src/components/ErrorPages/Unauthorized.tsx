import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';

const Unauthorized: React.FC = () => {
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
        <LockIcon 
          sx={{ 
            fontSize: 80, 
            color: 'warning.main',
            mb: 2 
          }} 
        />
        
        <Typography variant="h3" component="h1" gutterBottom color="warning.main">
          401
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Autentykacja wymagana
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Musisz się zalogować, aby uzyskać dostęp do tej strony.
          Sprawdź swoje dane logowania lub skontaktuj się z administratorem.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/login"
          >
            Zaloguj się
          </Button>
          
          <Button
            variant="outlined"
            component={Link}
            to="/"
          >
            Strona główna
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Unauthorized; 