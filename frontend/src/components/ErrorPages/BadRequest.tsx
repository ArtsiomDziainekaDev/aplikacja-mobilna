import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorIcon from '@mui/icons-material/Error';

const BadRequest: React.FC = () => {
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
        <ErrorIcon 
          sx={{ 
            fontSize: 80, 
            color: 'error.main',
            mb: 2 
          }} 
        />
        
        <Typography variant="h3" component="h1" gutterBottom color="error">
          400
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Nieprawidłowy request
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Twoje żądanie zawiera nieprawidłowe dane lub jest źle sformułowane.
          Sprawdź wprowadzone informacje i spróbuj ponownie.
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

export default BadRequest; 