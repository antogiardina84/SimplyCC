import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Paper } from '@mui/material';
import { useForm } from 'react-hook-form';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>();
  
  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      // Qui andrà la chiamata API di registrazione
      console.log('Register data:', data);
      
      // Navigazione alla pagina di login dopo la registrazione
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const password = watch('password');

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
            Registrazione
          </Typography>
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
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;