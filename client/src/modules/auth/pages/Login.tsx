import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Paper } from '@mui/material';
import { useForm } from 'react-hook-form';

interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  
  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      // Qui andrà la chiamata API di login
      console.log('Login data:', data);
      
      // Mock login - Rimuovere in produzione
      localStorage.setItem('token', 'fake_token');
      
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
            Accedi
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
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;