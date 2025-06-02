import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, Box, IconButton, Alert, Chip, TextField } from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Assicurati che PickupOrder rifletta la struttura da ocrPickupOrderService.ts o dal tuo database
// Se il tuo database salvasse 'senderName' e 'recipientName' direttamente, questa è la modifica corretta.
// Se il tuo database salva 'sender' e 'recipient' come oggetti con 'name', allora la definizione di PickupOrder
// deve riflettere questo, e il codice originale sarebbe stato corretto.
// Per la consistenza con la tua ExtractedPickupOrderData, assumiamo che siano stringhe dirette.
import * as pickupOrderService from '../services/ocrPickupOrderService'; // O il servizio che recupera i PickupOrder dal DB

// Definizione dell'interfaccia PickupOrder basata sulla tua ExtractedPickupOrderData
// e potenzialmente altri campi dal database.
// Se PickupOrderService recupera i dati con sender/recipient come oggetti, questa interfaccia andrebbe aggiornata.
// Per il contesto di questo problema, assumiamo che senderName e recipientName siano stringhe dirette.
export interface PickupOrder {
  id: string; // Assumiamo un ID per gli elementi della lista
  orderNumber: string;
  issueDate: string; // Le date dal server sono spesso stringhe ISO
  senderName: string; // Modificato da sender?.name
  recipientName: string; // Modificato da recipient?.name
  basinCode: string; // Modificato da basin?.code
  basinDescription?: string;
  flowType?: string;
  distanceKm?: number;
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  notes?: string;
  status: PickupOrderStatus;
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
  // Aggiungi qui altre proprietà se presenti nel tuo modello di database finale
  // Esempio:
  // sender: { id: string; name: string; vatNumber?: string; }; // Se il DB li gestisce come oggetti
  // recipient: { id: string; name: string; vatNumber?: string; }; // Se il DB li gestisce come oggetti
  // basin: { id: string; code: string; description?: string; }; // Se il DB li gestisce come oggetti
}

export type PickupOrderStatus = 'PENDING' | 'SCHEDULED' | 'READY' | 'COMPLETED' | 'CANCELLED';


const PickupOrderList = () => {
  const navigate = useNavigate();
  const [pickupOrders, setPickupOrders] = useState<PickupOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const fetchPickupOrders = async () => {
      try {
        setLoading(true);
        const data = await pickupOrderService.getPickupOrders();
        setPickupOrders(data);
        setFilteredOrders(data);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching pickup orders:', error);
        
        // Gestione più specifica degli errori
        if (error.response?.status === 404) {
          setError('Endpoint non trovato. Verifica che il server sia avviato.');
        } else if (error.response?.status === 500) {
          setError('Errore del server. Verifica che il database sia configurato correttamente.');
        } else if (error.code === 'ERR_NETWORK') {
          setError('Impossibile connettersi al server. Verifica che il backend sia in esecuzione.');
        } else {
          setError(error.response?.data?.message || 'Errore nel caricamento dei buoni di ritiro');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPickupOrders();
  }, []);

  useEffect(() => {
    if (filter === '') {
      setFilteredOrders(pickupOrders);
    } else {
      const filtered = pickupOrders.filter(order => 
        order.orderNumber.toLowerCase().includes(filter.toLowerCase()) ||
        // MODIFICA: Utilizza direttamente senderName e recipientName
        order.senderName.toLowerCase().includes(filter.toLowerCase()) ||
        order.recipientName.toLowerCase().includes(filter.toLowerCase()) ||
        order.basinCode.toLowerCase().includes(filter.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  }, [filter, pickupOrders]);

  const handleView = (id: string) => {
    navigate(`/pickup-orders/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/pickup-orders/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo buono di ritiro?')) {
      try {
        await pickupOrderService.deletePickupOrder(id);
        setPickupOrders(pickupOrders.filter(order => order.id !== id));
      } catch (error: any) {
        console.error('Error deleting pickup order:', error);
        alert(error.response?.data?.message || 'Errore durante l\'eliminazione del buono di ritiro');
      }
    }
  };

  const getStatusLabel = (status: PickupOrderStatus) => {
    switch (status) {
      case 'PENDING': return 'In Attesa';
      case 'SCHEDULED': return 'Programmato';
      case 'READY': return 'Pronto';
      case 'COMPLETED': return 'Completato';
      case 'CANCELLED': return 'Annullato';
      default: return status;
    }
  };

  const getStatusColor = (status: PickupOrderStatus) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'SCHEDULED': return 'info';
      case 'READY': return 'primary';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestione Buoni di Ritiro
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/pickup-orders/upload')}
        >
          Nuovo Buono di Ritiro
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Cerca per numero buono, mittente, destinatario o bacino"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ maxWidth: 400 }}
        />
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
                <TableCell>Numero Buono</TableCell>
                <TableCell>Data Emissione</TableCell>
                <TableCell>Mittente</TableCell>
                <TableCell>Destinatario</TableCell>
                <TableCell>Bacino</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Quantità Prev.</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {filter ? 'Nessun buono di ritiro trovato con i criteri di ricerca' : 'Nessun buono di ritiro trovato'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>
                      {format(new Date(order.issueDate), 'dd/MM/yyyy', { locale: it })}
                    </TableCell>
                    {/* MODIFICA: Accedi direttamente a senderName e recipientName */}
                    <TableCell>{order.senderName || 'N/A'}</TableCell>
                    <TableCell>{order.recipientName || 'N/A'}</TableCell>
                    <TableCell>{order.basinCode || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(order.status)} 
                        color={getStatusColor(order.status) as any} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {order.expectedQuantity ? `${order.expectedQuantity} t` : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleView(order.id)} color="info" title="Visualizza">
                        <Visibility />
                      </IconButton>
                      <IconButton onClick={() => handleEdit(order.id)} color="primary" title="Modifica">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(order.id)} color="error" title="Elimina">
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

export default PickupOrderList;