import { Container, Typography, Box, Button } from '@mui/material';
import { Construction, ArrowBack, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PlaceholderPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          minHeight: '60vh',
          justifyContent: 'center'
        }}
      >
        <Construction 
          sx={{ 
            fontSize: 80, 
            color: 'warning.main', 
            mb: 3 
          }} 
        />
        
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            mb: 2
          }}
        >
          Pagina in sviluppo
        </Typography>
        
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            maxWidth: 600, 
            mb: 4,
            lineHeight: 1.6
          }}
        >
          Questa funzionalità sarà disponibile presto. Stiamo lavorando per 
          implementarla nel prossimo aggiornamento del sistema.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ 
              minWidth: 160,
              borderRadius: 3
            }}
          >
            Torna indietro
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{ 
              minWidth: 160,
              borderRadius: 3
            }}
          >
            Vai alla Dashboard
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default PlaceholderPage;