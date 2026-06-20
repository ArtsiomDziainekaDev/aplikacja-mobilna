import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grow,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice';
import type { RootState } from '../store';
import { useAppDispatch } from '../hooks/useAppDispatch';
import type { RegisterCredentials } from '../types';
import { handleApiError } from '../utils/errorHandler';

const Register: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { error: authError, loading, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState<RegisterCredentials>({
    username: '',
    email: '',
    password: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    if (!formData.username.trim()) {
      setValidationError('Nazwa użytkownika jest wymagana');
      return false;
    }
    if (!formData.email.trim()) {
      setValidationError('Email jest wymagany');
      return false;
    }
    if (!formData.password) {
      setValidationError('Hasło jest wymagane');
      return false;
    }
    if (formData.password.length < 6) {
      setValidationError('Hasło musi mieć co najmniej 6 znaków');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setValidationError('Nieprawidłowy email');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(register(formData)).unwrap();
      setSuccessMessage(result.message);
      setValidationError(null);
      setIsRedirecting(true);

      // Przekierowanie na stronę logowania po krótkim komunikacie sukcesu
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { registrationSuccess: 'Konto zostało utworzone. Zaloguj się.' },
        });
      }, 1200);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setValidationError(errorMessage);
      setSuccessMessage(null);
      setIsRedirecting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setValidationError(null);
    setSuccessMessage(null);
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Grow in timeout={350}>
          <Paper
            elevation={6}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: 3,
              backdropFilter: 'blur(2px)',
            }}
          >
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Rejestracja
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nazwa użytkownika"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              error={!!validationError && !formData.username.trim()}
              disabled={loading || !!successMessage}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!validationError && !formData.email.trim()}
              disabled={loading || !!successMessage}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Hasło"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!validationError && !formData.password}
              disabled={loading || !!successMessage}
            />
            {validationError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {validationError}
              </Alert>
            )}
            {successMessage && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {successMessage}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.2,
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateY(-1px)' },
              }}
              disabled={loading || !!successMessage}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isRedirecting ? (
                'Przekierowywanie...'
              ) : (
                'Zarejestruj się'
              )}
            </Button>
            <Button
              component={Link}
              to="/login"
              fullWidth
              sx={{ textAlign: 'center', opacity: 0.9 }}
              disabled={loading || !!successMessage}
            >
              Masz już konto? Zaloguj się
            </Button>
          </form>
          </Paper>
        </Grow>
      </Box>
    </Container>
  );
};

export default Register; 