import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as authService from '../services/authService';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>();
  
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await authService.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName
      });
      
      setSuccess('Registrazione completata con successo! Ora puoi effettuare il login.');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.response?.data?.message || 'Errore durante la registrazione');
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
            Registrazione
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="Nome"
              autoComplete="given-name"
              autoFocus
              {...register('firstName', { 
                required: 'Nome è obbligatorio'
              })}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Cognome"
              autoComplete="family-name"
              {...register('lastName', { 
                required: 'Cognome è obbligatorio'
              })}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              autoComplete="email"
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
              autoComplete="new-password"
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
            <TextField
              margin="normal"
              required
              fullWidth
              id="confirmPassword"
              label="Conferma Password"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword', { 
                required: 'Conferma Password è obbligatoria',
                validate: value => value === password || 'Le password non corrispondono'
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, height: '48px' }}
              disabled={loading}
            >
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                disabled={loading}
              >
                Hai già un account? Accedi
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;