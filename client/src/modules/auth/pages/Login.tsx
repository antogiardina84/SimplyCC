import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as authService from '../services/authService';

interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  
  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.login(data);
      navigate('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || 'Si è verificato un errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4 }}>
          <Typography component="h1" variant="h4" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
            Accedi al Sistema
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              autoComplete="email"
              autoFocus
              {...register('email', { 
                required: 'Email è obbligatoria',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Email non valida'
                }
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              {...register('password', { 
                required: 'Password è obbligatoria',
                minLength: {
                  value: 6,
                  message: 'Password deve essere almeno 6 caratteri'
                }
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, height: '48px' }}
              disabled={loading}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="text"
                onClick={() => navigate('/register')}
                disabled={loading}
              >
                Non hai un account? Registrati
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;