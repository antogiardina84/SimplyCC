// client/src/modules/users/pages/UserList.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, Box, Chip, IconButton, Alert, FormControl, 
  InputLabel, Select, MenuItem } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import * as userService from '../services/userService';
import * as authService from '../../auth/services/authService';
import api from '../../../core/services/api';
import type { User } from '../services/userService';

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.getUsers();
        setUsers(data);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        setError(error.response?.data?.message || 'Errore nel caricamento degli utenti');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/users/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    // Non permettere di eliminare se stesso
    if (id === currentUser?.id) {
      alert('Non puoi eliminare il tuo stesso account');
      return;
    }

    if (window.confirm('Sei sicuro di voler eliminare questo utente?')) {
      try {
        await userService.deleteUser(id);
        setUsers(users.filter(user => user.id !== id));
      } catch (error: any) {
        console.error('Error deleting user:', error);
        alert(error.response?.data?.message || 'Errore durante l\'eliminazione dell\'utente');
      }
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      
      // Aggiorna la lista degli utenti
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      // Mostra messaggio di successo
      alert('Ruolo aggiornato con successo');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      alert(error.response?.data?.message || 'Errore durante l\'aggiornamento del ruolo');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Amministratore';
      case 'MANAGER': return 'Manager';
      case 'OPERATOR': return 'Operatore';
      case 'USER': return 'Utente';
      default: return role;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestione Utenti
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/users/new')}
        >
          Nuovo Utente
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Ruolo</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Nessun utente trovato</TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.firstName || user.lastName || 'N/A'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={user.id === currentUser?.id} // Non permettere di modificare il proprio ruolo
                          variant="outlined"
                        >
                          <MenuItem value="USER">Utente</MenuItem>
                          <MenuItem value="OPERATOR">Operatore</MenuItem>
                          <MenuItem value="MANAGER">Manager</MenuItem>
                          <MenuItem value="ADMIN">Amministratore</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.active ? 'Attivo' : 'Inattivo'} 
                        color={user.active ? 'success' : 'error'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleEdit(user.id)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(user.id)} 
                        color="error"
                        disabled={user.id === currentUser?.id} // Non permettere di eliminare se stesso
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default UserList;