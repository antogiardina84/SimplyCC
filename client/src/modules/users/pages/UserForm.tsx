// client/src/modules/users/pages/UserForm.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Paper, Box, FormControlLabel, 
  Switch, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as userService from '../services/userService';
import type { User, CreateUserData, UpdateUserData } from '../services/userService';

const UserForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const isEditMode = !!id;

  useEffect(() => {
    const fetchUser = async () => {
      if (!isEditMode) return;
      
      try {
        setInitialLoading(true);
        const userData = await userService.getUserById(id);
        reset({
          email: userData.email,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role,
          active: userData.active,
        });
      } catch (error: any) {
        console.error('Error fetching user:', error);
        setError(error.response?.data?.message || 'Errore nel caricamento dei dati utente');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUser();
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isEditMode) {
        const updateData: UpdateUserData = {
          email: data.email,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          role: data.role,
          active: data.active,
        };
        
        // Aggiungi la password solo se è stata inserita
        if (data.password) {
          updateData.password = data.password;
        }
        
        await userService.updateUser(id, updateData);
      } else {
        const createData: CreateUserData = {
          email: data.email,
          password: data.password,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          role: data.role,
        };
        
        await userService.createUser(createData);
      }
        navigate('/users');
    } catch (error: any) {
      console.error('Error saving user:', error);
      setError(error.response?.data?.message || `Errore durante il ${isEditMode ? 'salvataggio' : 'creazione'} dell'utente`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Modifica Utente' : 'Nuovo Utente'}
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="email"
            control={control}
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
                margin="normal"
                fullWidth
                label="Email"
                error={!!errors.email}
                helperText={errors.email?.message as string}
              />
            )}
          />
          
          {!isEditMode && (
            <Controller
              name="password"
              control={control}
              defaultValue=""
              rules={{
                required: 'Password è obbligatoria',
                minLength: {
                  value: 6,
                  message: 'Password deve essere almeno 6 caratteri'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  label="Password"
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message as string}
                />
              )}
            />
          )}
          
          {isEditMode && (
            <Controller
              name="password"
              control={control}
              defaultValue=""
              rules={{
                minLength: {
                  value: 6,
                  message: 'Se specificata, la password deve essere almeno 6 caratteri'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  label="Nuova Password (lasciare vuoto per mantenere l'attuale)"
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message as string}
                />
              )}
            />
          )}
          
          <Controller
            name="firstName"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                label="Nome"
              />
            )}
          />
          
          <Controller
            name="lastName"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                label="Cognome"
              />
            )}
          />
          
          <Controller
            name="role"
            control={control}
            defaultValue="USER"
            rules={{ required: 'Ruolo è obbligatorio' }}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.role}>
                <InputLabel>Ruolo</InputLabel>
                <Select {...field} label="Ruolo">
                  <MenuItem value="ADMIN">Amministratore</MenuItem>
                  <MenuItem value="MANAGER">Manager</MenuItem>
                  <MenuItem value="OPERATOR">Operatore</MenuItem>
                  <MenuItem value="USER">Utente</MenuItem>
                </Select>
              </FormControl>
            )}
          />
          
          {isEditMode && (
            <Controller
              name="active"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} {...field} />}
                  label="Utente attivo"
                  sx={{ mt: 2, mb: 2 }}
                />
              )}
            />
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/users')}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Salvataggio...' : 'Salva'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserForm;