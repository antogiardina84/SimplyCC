// client/src/modules/deliveries/services/materialTypes.api.ts - VERSIONE CORRETTA COMPLETA

import api from '../../../core/services/api';
import type {
  MaterialType,
  MaterialTypeHierarchy,
  CreateMaterialTypeData,
  UpdateMaterialTypeData,
  MaterialTypesFilters,
  MaterialTypeStatistics
} from '../types/deliveries.types';
import axios, { AxiosError } from 'axios'; // Importa AxiosError per una migliore gestione dei tipi di errore

export const materialTypesApi = {
  // ✅ CORRETTO: Ottieni tutte le tipologie materiali
  getAll: async (filters?: MaterialTypesFilters): Promise<MaterialType[]> => {
    try {
      const params = new URLSearchParams();

      // Gestisci filtri
      if (filters?.includeInactive !== undefined) {
        params.append('includeInactive', filters.includeInactive.toString());
      }
      if (filters?.isParent !== undefined) {
        params.append('isParent', filters.isParent.toString());
      }

      console.log('🔍 Fetching material types with params:', params.toString());

      // 🔧 BACKEND ENDPOINT: GET /material-types
      const response = await api.get(`/material-types?${params.toString()}`);

      console.log('✅ Material types loaded:', response.data);
      return response.data;

    } catch (error: unknown) { // Specifica error come unknown
      console.error('❌ Error fetching material types:', error);
      if (error instanceof AxiosError) { // Controlla se è un errore Axios
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  },

  // ✅ CORRETTO: Ottieni tipologia per ID
  getById: async (id: string): Promise<MaterialType> => {
    try {
      console.log('🔍 Fetching material type by ID:', id);

      // 🔧 BACKEND ENDPOINT: GET /material-types/:id
      const response = await api.get(`/material-types/${id}`);

      console.log('✅ Material type loaded:', response.data);
      return response.data;

    } catch (error: unknown) { // Specifica error come unknown
      console.error('❌ Error fetching material type by ID:', error);
      if (error instanceof AxiosError) { // Controlla se è un errore Axios
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  },

  // ✅ CORRETTO: Ottieni tipologia per codice
  getByCode: async (code: string): Promise<MaterialType> => {
    try {
      console.log('🔍 Fetching material type by code:', code);

      // 🔧 BACKEND ENDPOINT: GET /material-types/code/:code
      const response = await api.get(`/material-types/code/${code}`);

      console.log('✅ Material type by code loaded:', response.data);
      return response.data;

    } catch (error: unknown) { // Specifica error come unknown
      console.error('❌ Error fetching material type by code:', error);
      if (error instanceof AxiosError) { // Controlla se è un errore Axios
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  },

  // ✅ CORRETTO: Ottieni struttura gerarchica
  getHierarchy: async (): Promise<MaterialTypeHierarchy[]> => {
    try {
      console.log('🔍 Fetching material types hierarchy...');

      // 🔧 BACKEND ENDPOINT: GET /material-types/hierarchy
      const response = await api.get('/material-types/hierarchy');

      console.log('✅ Material types hierarchy loaded:', response.data);
      return response.data;

    } catch (error: unknown) { // Specifica error come unknown
      console.error('❌ Error fetching material types hierarchy:', error);
      if (error instanceof AxiosError) { // Controlla se è un errore Axios
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  },

  // ✅ CORRETTO: Crea nuova tipologia
  create: async (data: CreateMaterialTypeData): Promise<MaterialType> => {
    try {
      console.log('🚀 Creating material type with data:', data);

      // Validazione dati obbligatori
      if (!data.code) {
        throw new Error('Codice tipologia materiale è obbligatorio');
      }
      if (!data.name) {
        throw new Error('Nome tipologia materiale è obbligatorio');
      }
      if (!data.unit) {
        throw new Error('Unità di misura è obbligatoria');
      }

      // Prepara i dati per l'invio
      const payload: CreateMaterialTypeData = {
        code: data.code.trim().toUpperCase(), // Normalizza codice
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        unit: data.unit.trim() || 'kg',
        cerCode: data.cerCode?.trim() || undefined,
        reference: data.reference?.trim() || undefined,
        color: data.color || '#666666',
        sortOrder: data.sortOrder || 0,
        parentId: data.parentId || undefined,
      };

      console.log('📤 Sending payload:', payload);

      // 🔧 BACKEND ENDPOINT: POST /material-types
      const response = await api.post('/material-types', payload);

      console.log('✅ Material type created successfully:', response.data);
      return response.data;

    } catch (error: unknown) { // Specifica error come unknown
      console.error('❌ Error creating material type:', error);

      // Gestione errori più specifica
      if (error instanceof AxiosError && error.response) { // Verifica che sia un AxiosError e abbia una risposta
        if (error.response.status === 400) {
          const message = error.response.data?.message || 'Dati non validi';
          throw new Error(`Errore di validazione: ${message}`);
        } else if (error.response.status === 409) {
          throw new Error('Codice tipologia materiale già esistente');
        } else if (error.response.status === 500) {
          throw new Error('Errore interno del server. Riprova più tardi.');
        }
      }
      // Se non è un AxiosError o non ha una risposta specifica
      if (error instanceof Error) {
        throw new Error(error.message || 'Errore durante la creazione della tipologia materiale');
      }
      throw new Error('Errore sconosciuto durante la creazione della tipologia materiale'); // Errore generico
    }
  },

  // ✅ CORRETTO: Aggiorna tipologia
  update: async (id: string, data: UpdateMaterialTypeData): Promise<MaterialType> => {
    try {
      console.log('🔄 Updating material type:', id, 'with data:', data);

      // Prepara i dati per l'aggiornamento (rimuovi campi undefined)
      const payload: UpdateMaterialTypeData = {};

      if (data.code !== undefined) payload.code = data.code.trim().toUpperCase();
      if (data.name !== undefined) payload.name = data.name.trim();
      if (data.description !== undefined) payload.description = data.description?.trim() || undefined;
      if (data.unit !== undefined) payload.unit = data.unit.trim();
      if (data.cerCode !== undefined) payload.cerCode = data.cerCode?.trim() || undefined;
      if (data.reference !== undefined) payload.reference = data.reference?.trim() || undefined;
      if (data.color !== undefined) payload.color = data.color;
      if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;
      if (data.parentId !== undefined) payload.parentId = data.parentId || undefined;
      if (data.isActive !== undefined) payload.isActive = data.isActive;

      console.log('📤 Sending update payload:', payload);

      // 🔧 BACKEND ENDPOINT: PUT /material-types/:id
      const response = await api.put(`/material-types/${id}`, payload);

      console.log('✅ Material type updated successfully:', response.data);
      return response.data;

    } catch (error: unknown) { // Specifica error come unknown
      console.error('❌ Error updating material type:', error);

      // Gestione errori specifica
      if (error instanceof AxiosError && error.response) { // Verifica che sia un AxiosError e abbia una risposta
        if (error.response.status === 404) {
          throw new Error('Tipologia materiale non trovata');
        } else if (error.response.status === 400) {
          const message = error.response.data?.message || 'Dati non validi';
          throw new Error(`Errore di validazione: ${message}`);
        } else if (error.response.status === 409) {
          throw new Error('Codice tipologia materiale già esistente');
        }
      }
      // Se non è un AxiosError o non ha una risposta specifica
      if (error instanceof Error) {
        throw new Error(error.message || 'Errore durante l\'aggiornamento della tipologia materiale');
      }
      throw new Error('Errore sconosciuto durante l\'aggiornamento della tipologia materiale'); // Errore generico
    }
  },

  // ✅ CORRETTO: Elimina tipologia
  delete: async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting material type:', id);

      // 🔧 BACKEND ENDPOINT: DELETE /material-types/:id
      await api.delete(`/material-types/${id}`); // Rimosso 'const response =' perché non utilizzata e il tipo di ritorno è void

      console.log('✅ Material type deleted successfully');
      return; // Restituisce void come specificato dal Promise<void>

    } catch (error: unknown) { // Specifica error come unknown
      console.error('❌ Error deleting material type:', error);

      // Gestione errori specifica
      if (error instanceof AxiosError && error.response) { // Verifica che sia un AxiosError e abbia una risposta
        if (error.response.status === 404) {
          throw new Error('Tipologia materiale non trovata');
        } else if (error.response.status === 400) {
          const message = error.response.data?.message || 'Impossibile eliminare';
          throw new Error(`Errore: ${message}`);
        }
      }
      // Se non è un AxiosError o non ha una risposta specifica
      if (error instanceof Error) {
        throw new Error(error.message || 'Errore durante l\'eliminazione della tipologia materiale');
      }
      throw new Error('Errore sconosciuto durante l\'eliminazione della tipologia materiale'); // Errore generico
    }
  },

  // ✅ CORRETTO: Ottieni statistiche tipologia
  getStatistics: async (id: string, year?: number): Promise<MaterialTypeStatistics> => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());

      console.log('📊 Fetching material type statistics for:', id);

      // 🔧 BACKEND ENDPOINT: GET /material-types/:id/statistics
      const response = await api.get(`/material-types/${id}/statistics?${params.toString()}`);

      console.log('✅ Material type statistics loaded:', response.data);
      return response.data;

    } catch (error: unknown) { // Specifica error come unknown
      console.error('❌ Error fetching material type statistics:', error);
      if (error instanceof AxiosError) { // Controlla se è un errore Axios
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  },

  // ✅ EXTRA: Metodo di test per verificare connettività
  testConnection: async (): Promise<boolean> => {
    try {
      console.log('🔍 Testing material types API connection...');

      await api.get('/material-types?includeInactive=false'); // Rimosso 'const response =' perché non utilizzata

      console.log('✅ API connection test successful');
      return true;

    } catch (error: unknown) { // Specifica error come unknown
      console.error('❌ API connection test failed:', error);
      // Non c'è bisogno di rilanciare l'errore qui, si ritorna false
      return false;
    }
  }
};

// ✅ EXPORT DEFAULT per compatibilità
export default materialTypesApi;