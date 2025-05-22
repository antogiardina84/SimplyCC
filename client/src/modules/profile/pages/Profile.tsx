// client/src/modules/profile/pages/Profile.tsx

import { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Grid, TextField, Button, Alert, Divider } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as authService from '../../auth/services/authService';
import * as profileService from '../services/profileService';

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  
  const { control: profileControl, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors } } = useForm();
  const { control: passwordControl, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors }, watch: watchPassword } = useForm();
  
  const user = authService.getCurrentUser();
  // Correggi la sintassi di watch
  const newPassword = watchPassword('newPassword', '');

  useEffect(() => {
    if (user) {
      resetProfile({
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await profileService.updateProfile({
        email: data.email,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
      });
      
      // Aggiorna i dati utente nel localStorage
      const updatedUser = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSuccess('Profilo aggiornato con successo');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Errore durante l\'aggiornamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: any) => {
    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordSuccess(null);
      
      await profileService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      
      resetPassword();
      setPasswordSuccess('Password cambiata con successo');
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.response?.data?.message || 'Errore durante il cambio password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Profilo Utente
      </Typography>

      <Grid container spacing={3}>
        {/* Sezione Informazioni Profilo */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informazioni Personali
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
            
            <Box component="form" onSubmit={handleProfileSubmit(onProfileSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Controller
                    name="email"
                    control={profileControl}
                    defaultValue=""
                    rules={{
                      required: 'Email è obbligatoria',
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Email non valida'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email"
                        error={!!profileErrors.email}
                        helperText={profileErrors.email?.message as string}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Controller
                    name="firstName"
                    control={profileControl}
                    defaultValue=""
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Nome"
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Controller
                    name="lastName"
                    control={profileControl}
                    defaultValue=""
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Cognome"
                      />
                    )}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Sezione Cambio Password */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cambio Password
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {passwordError && <Alert severity="error" sx={{ mb: 3 }}>{passwordError}</Alert>}
            {passwordSuccess && <Alert severity="success" sx={{ mb: 3 }}>{passwordSuccess}</Alert>}
            
            <Box component="form" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Controller
                    name="currentPassword"
                    control={passwordControl}
                    defaultValue=""
                    rules={{ required: 'Password corrente è obbligatoria' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Password Corrente"
                        type="password"
                        error={!!passwordErrors.currentPassword}
                        helperText={passwordErrors.currentPassword?.message as string}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Controller
                    name="newPassword"
                    control={passwordControl}
                    defaultValue=""
                    rules={{
                      required: 'Nuova password è obbligatoria',
                      minLength: {
                        value: 6,
                        message: 'Password deve essere almeno 6 caratteri'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Nuova Password"
                        type="password"
                        error={!!passwordErrors.newPassword}
                        helperText={passwordErrors.newPassword?.message as string}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Controller
                    name="confirmPassword"
                    control={passwordControl}
                    defaultValue=""
                    rules={{
                      required: 'Conferma password è obbligatoria',
                      validate: (value) => 
                        value === newPassword || 'Le password non corrispondono'
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Conferma Nuova Password"
                        type="password"
                        error={!!passwordErrors.confirmPassword}
                        helperText={passwordErrors.confirmPassword?.message as string}
                      />
                    )}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Cambiando...' : 'Cambia Password'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Informazioni Account */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informazioni Account
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Ruolo</Typography>
                <Typography variant="body1">{user?.role || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Data Registrazione</Typography>
                <Typography variant="body1">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;