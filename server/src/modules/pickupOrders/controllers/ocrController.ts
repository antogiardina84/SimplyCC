// server/src/modules/pickupOrders/controllers/ocrController.ts

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { OCRPickupOrderService, ExtractedPickupOrderData } from '../services/ocrpickupOrder.service';
import * as pickupOrderService from '../services/pickupOrders.service';
import * as clientService from '../../clients/services/clients.service';
import * as basinService from '../../basins/services/basins.service';
import { HttpException } from '../../../core/middleware/error.middleware';
import { Express } from 'express';

// Interfaccia per Request con file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Interfacce per le entità del database (compatibili con Prisma)
interface DatabaseClient {
  id: string;
  name: string;
  vatNumber: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  province?: string | null;
  phone?: string | null;
  pec?: string | null;
  contractId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseBasin {
  id: string;
  code: string;
  description?: string | null;
  flowType: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Client {
  id: string;
  name: string;
  vatNumber: string;
  email?: string;
  address?: string;
  city?: string;
}

interface Basin {
  id: string;
  code: string;
  description?: string;
  flowType: string;
  clientId: string;
}

// Interfacce per i risultati del matching
interface ClientMatch {
  exact: Client | null;
  suggestions: (Client & { similarity: number })[];
}

interface BasinMatch {
  exact: Basin | null;
  suggestions: Basin[];
}

interface MatchedEntities {
  sender: Client | null;
  recipient: Client | null;
  basin: Basin | null;
  suggestions: {
    senders: (Client & { similarity: number })[];
    recipients: (Client & { similarity: number })[];
    basins: Basin[];
  };
}

// Configurazione multer per upload file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new HttpException(400, 'Solo file PDF sono accettati'));
    }
  },
});

export const uploadMiddleware = upload.single('pdfFile');

export class OCRController {
  private ocrService: OCRPickupOrderService;

  constructor() {
    this.ocrService = new OCRPickupOrderService();
  }

  /**
   * Estrae i dati da un PDF e restituisce i dati estratti per la revisione
   */
  public extractFromPDF = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new HttpException(400, 'File PDF richiesto');
      }

      console.log('Processamento PDF:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Estrai dati dal PDF
      const extractedData = await this.ocrService.extractFromPDF(req.file.buffer);

      // Cerca di trovare clienti e bacini corrispondenti nel database
      const matchedEntities = await this.findMatchingEntities(extractedData);

      const response = {
        success: true,
        extractedData: extractedData,
        matchedEntities: matchedEntities,
        suggestions: {
          needsReview: this.generateReviewSuggestions(extractedData),
          confidence: extractedData.confidence,
          qualityScore: this.calculateQualityScore(extractedData)
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Errore estrazione OCR:', error);
      next(error);
    }
  };

  /**
   * Crea un buono di ritiro dai dati estratti, con possibilità di correzioni manuali
   */
  public createFromExtractedData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { extractedData, corrections, autoCreate } = req.body;

      if (!extractedData) {
        throw new HttpException(400, 'Dati estratti richiesti');
      }

      // Applica le correzioni manuali se presenti
      const finalData = this.applyCorrections(extractedData, corrections);

      // Valida e prepara i dati per la creazione
      const pickupOrderData = await this.preparePickupOrderData(finalData, autoCreate);

      if (autoCreate) {
        // Crea automaticamente il buono di ritiro
        const pickupOrder = await pickupOrderService.createPickupOrder(pickupOrderData);
        
        res.status(201).json({
          success: true,
          message: 'Buono di ritiro creato con successo',
          pickupOrder: pickupOrder,
          extractedData: finalData
        });
      } else {
        // Restituisci i dati preparati per revisione finale
        res.status(200).json({
          success: true,
          message: 'Dati preparati per la creazione',
          preparedData: pickupOrderData,
          extractedData: finalData
        });
      }
    } catch (error) {
      console.error('Errore creazione da dati estratti:', error);
      next(error);
    }
  };

  /**
   * Processo completo: estrai dal PDF e crea automaticamente il buono di ritiro
   */
  public processAndCreate = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new HttpException(400, 'File PDF richiesto');
      }

      console.log('Processo completo per PDF:', req.file.originalname);

      // Estrai dati dal PDF
      const extractedData = await this.ocrService.extractFromPDF(req.file.buffer);
      
      // Se la confidenza è troppo bassa, richiede revisione manuale
      if (extractedData.confidence < 70) {
        return await this.extractFromPDF(req, res, next);
      }

      // Prepara e crea automaticamente
      const pickupOrderData = await this.preparePickupOrderData(extractedData, true);
      const pickupOrder = await pickupOrderService.createPickupOrder(pickupOrderData);

      res.status(201).json({
        success: true,
        message: 'Buono di ritiro creato automaticamente',
        pickupOrder: pickupOrder,
        extractedData: extractedData,
        confidence: extractedData.confidence
      });
    } catch (error) {
      console.error('Errore processo completo:', error);
      next(error);
    }
  };

  /**
   * Converte DatabaseClient in Client per compatibilità
   */
  private convertDatabaseClient(dbClient: DatabaseClient): Client {
    return {
      id: dbClient.id,
      name: dbClient.name,
      vatNumber: dbClient.vatNumber,
      email: dbClient.email || undefined,
      address: dbClient.address || undefined,
      city: dbClient.city || undefined,
    };
  }

  /**
   * Converte DatabaseBasin in Basin per compatibilità
   */
  private convertDatabaseBasin(dbBasin: DatabaseBasin): Basin {
    return {
      id: dbBasin.id,
      code: dbBasin.code,
      description: dbBasin.description || undefined,
      flowType: dbBasin.flowType,
      clientId: dbBasin.clientId,
    };
  }

  /**
   * Cerca entità corrispondenti nel database
   */
  private async findMatchingEntities(extractedData: ExtractedPickupOrderData): Promise<MatchedEntities> {
    const matchedEntities: MatchedEntities = {
      sender: null,
      recipient: null,
      basin: null,
      suggestions: {
        senders: [],
        recipients: [],
        basins: []
      }
    };

    try {
      // Ottieni tutti i clienti e bacini
      const [dbClients, dbBasins] = await Promise.all([
        clientService.findAllClients(),
        basinService.findAllBasins()
      ]);

      // Converti i tipi database in tipi interni
      const clients = dbClients.map(client => this.convertDatabaseClient(client));
      const basins = dbBasins.map(basin => this.convertDatabaseBasin(basin));

      // Cerca mittente
      if (extractedData.senderName) {
        const senderMatch = this.findClientByName(clients, extractedData.senderName);
        matchedEntities.sender = senderMatch.exact;
        matchedEntities.suggestions.senders = senderMatch.suggestions;
      }

      // Cerca destinatario
      if (extractedData.recipientName) {
        const recipientMatch = this.findClientByName(clients, extractedData.recipientName);
        matchedEntities.recipient = recipientMatch.exact;
        matchedEntities.suggestions.recipients = recipientMatch.suggestions;
      }

      // Cerca bacino
      if (extractedData.basinCode) {
        const basinMatch = this.findBasinByCode(basins, extractedData.basinCode);
        matchedEntities.basin = basinMatch.exact;
        matchedEntities.suggestions.basins = basinMatch.suggestions;
      }

    } catch (error) {
      console.error('Errore ricerca entità:', error);
      // Non bloccare il processo, continua senza match
    }

    return matchedEntities;
  }

  /**
   * Cerca un cliente per nome con matching fuzzy
   */
  private findClientByName(clients: Client[], name: string): ClientMatch {
    const result: ClientMatch = {
      exact: null,
      suggestions: []
    };

    if (!name || !clients) return result;

    const normalizedName = name.toLowerCase().trim();
    
    // Cerca match esatto
    const exactMatch = clients.find(client => 
      client.name.toLowerCase().trim() === normalizedName
    );
    
    if (exactMatch) {
      result.exact = exactMatch;
      return result;
    }

    // Cerca match parziali con punteggio di similarità
    const suggestions = clients
      .map(client => ({
        ...client,
        similarity: this.calculateSimilarity(normalizedName, client.name.toLowerCase())
      }))
      .filter(client => client.similarity > 0.5) // Solo similarità > 50%
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Massimo 5 suggerimenti

    result.suggestions = suggestions;
    
    // Se c'è un match con alta similarità (>90%), consideralo come esatto
    if (suggestions.length > 0 && suggestions[0].similarity > 0.9) {
      result.exact = suggestions[0];
    }

    return result;
  }

  /**
   * Cerca un bacino per codice
   */
  private findBasinByCode(basins: Basin[], code: string): BasinMatch {
    const result: BasinMatch = {
      exact: null,
      suggestions: []
    };

    if (!code || !basins) return result;

    const normalizedCode = code.trim();
    
    // Cerca match esatto per codice
    const exactMatch = basins.find(basin => 
      basin.code === normalizedCode
    );
    
    if (exactMatch) {
      result.exact = exactMatch;
      return result;
    }

    // Cerca match parziali
    const suggestions = basins
      .filter(basin => 
        basin.code.includes(normalizedCode) || 
        normalizedCode.includes(basin.code)
      )
      .slice(0, 5);

    result.suggestions = suggestions;

    return result;
  }

  /**
   * Calcola la similarità tra due stringhe usando Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * Genera suggerimenti per la revisione dei dati
   */
  private generateReviewSuggestions(extractedData: ExtractedPickupOrderData): string[] {
    const suggestions: string[] = [];

    if (!extractedData.orderNumber) {
      suggestions.push('Numero buono non rilevato - richiede inserimento manuale');
    }

    if (extractedData.confidence < 80) {
      suggestions.push('Confidenza OCR bassa - verificare tutti i campi estratti');
    }

    if (!extractedData.senderName) {
      suggestions.push('Nome mittente non rilevato');
    }

    if (!extractedData.recipientName) {
      suggestions.push('Nome destinatario non rilevato');
    }

    if (!extractedData.basinCode) {
      suggestions.push('Codice bacino non rilevato');
    }

    if (!extractedData.issueDate || extractedData.issueDate.getTime() < Date.now() - 365 * 24 * 60 * 60 * 1000) {
      suggestions.push('Data emissione sospetta - verificare formato data');
    }

    return suggestions;
  }

  /**
   * Calcola un punteggio di qualità per i dati estratti
   */
  private calculateQualityScore(extractedData: ExtractedPickupOrderData): number {
    let score = 0;
    let maxScore = 0;

    // Campi obbligatori (peso 2)
    const requiredFields: (keyof ExtractedPickupOrderData)[] = [
      'orderNumber', 'senderName', 'recipientName', 'basinCode', 'issueDate'
    ];

    requiredFields.forEach(field => {
      maxScore += 2;
      if (extractedData[field] && String(extractedData[field]).trim()) {
        score += 2;
      }
    });

    // Campi opzionali ma importanti (peso 1)
    const optionalFields: (keyof ExtractedPickupOrderData)[] = [
      'distanceKm', 'flowType', 'senderAddress', 'recipientAddress',
      'availabilityDate', 'shippingRequestDate'
    ];

    optionalFields.forEach(field => {
      maxScore += 1;
      if (extractedData[field] && String(extractedData[field]).trim()) {
        score += 1;
      }
    });

    // Bonus per alta confidenza OCR
    maxScore += 2;
    if (extractedData.confidence > 90) {
      score += 2;
    } else if (extractedData.confidence > 70) {
      score += 1;
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Applica correzioni manuali ai dati estratti
   */
  private applyCorrections(extractedData: ExtractedPickupOrderData, corrections: Record<string, unknown>): ExtractedPickupOrderData {
    if (!corrections) return extractedData;

    const correctedData = { ...extractedData };

    // Applica tutte le correzioni fornite
    Object.keys(corrections).forEach(key => {
      if (corrections[key] !== undefined && corrections[key] !== null) {
        (correctedData as Record<string, unknown>)[key] = corrections[key];
      }
    });

    return correctedData;
  }

  /**
   * Prepara i dati per la creazione del buono di ritiro
   */
  private async preparePickupOrderData(extractedData: ExtractedPickupOrderData, autoCreate: boolean): Promise<pickupOrderService.CreatePickupOrderData> {
    const pickupOrderData: pickupOrderService.CreatePickupOrderData = {
      orderNumber: extractedData.orderNumber,
      issueDate: extractedData.issueDate,
      scheduledDate: extractedData.availabilityDate,
      flowType: extractedData.flowType || 'A',
      distanceKm: extractedData.distanceKm,
      status: 'PENDING',
      notes: `Creato tramite OCR - Confidenza: ${extractedData.confidence}%`,
      senderId: '', // Sarà risolto dopo
      recipientId: '', // Sarà risolto dopo
      basinId: '', // Sarà risolto dopo
    };

    // Gestisci mittente
    if (autoCreate) {
      pickupOrderData.senderId = await this.resolveClientId(
        extractedData.senderName, 
        extractedData.senderAddress,
        extractedData.senderCity,
        extractedData.senderEmail,
        'sender'
      );

      // Gestisci destinatario
      pickupOrderData.recipientId = await this.resolveClientId(
        extractedData.recipientName,
        extractedData.recipientAddress,
        extractedData.recipientCity,
        extractedData.recipientEmail,
        'recipient'
      );

      // Gestisci bacino
      pickupOrderData.basinId = await this.resolveBasinId(
        extractedData.basinCode,
        extractedData.basinDescription,
        extractedData.flowType
      );
    }

    return pickupOrderData;
  }

  /**
   * Risolve l'ID del cliente, creandolo se necessario
   */
  private async resolveClientId(name: string, address?: string, city?: string, email?: string, type?: string): Promise<string> {
    if (!name) {
      throw new HttpException(400, `Nome ${type || 'cliente'} richiesto`);
    }

    try {
      // Cerca cliente esistente
      const dbClients = await clientService.findAllClients();
      const existingClient = dbClients.find(client => 
        client.name.toLowerCase().trim() === name.toLowerCase().trim()
      );

      if (existingClient) {
        return existingClient.id;
      }

      // Crea nuovo cliente se non esiste
      const newClientData = {
        name: name.trim(),
        vatNumber: `AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // VAT temporaneo
        address: address || undefined,
        city: city || undefined,
        email: email || undefined,
      };

      const newClient = await clientService.createClient(newClientData);
      return newClient.id;

    } catch (error) {
      console.error(`Errore risoluzione cliente ${type}:`, error);
      throw new HttpException(500, `Errore nella risoluzione del ${type || 'cliente'}`);
    }
  }

  /**
   * Risolve l'ID del bacino, creandolo se necessario
   */
  private async resolveBasinId(code: string, description?: string, flowType?: string): Promise<string> {
    if (!code) {
      throw new HttpException(400, 'Codice bacino richiesto');
    }

    try {
      // Cerca bacino esistente
      const dbBasins = await basinService.findAllBasins();
      const existingBasin = dbBasins.find(basin => basin.code === code);

      if (existingBasin) {
        return existingBasin.id;
      }

      // Per auto-creazione bacino, serve un cliente di default
      // In questo caso, creiamo un cliente "Sistema" se non esiste
      const systemClient = await this.getOrCreateSystemClient();

      // Crea nuovo bacino
      const newBasinData = {
        code: code,
        description: description || `Bacino ${code}`,
        flowType: flowType || 'A',
        clientId: systemClient.id,
      };

      const newBasin = await basinService.createBasin(newBasinData);
      return newBasin.id;

    } catch (error) {
      console.error('Errore risoluzione bacino:', error);
      throw new HttpException(500, 'Errore nella risoluzione del bacino');
    }
  }

  /**
   * Ottiene o crea un cliente di sistema per bacini auto-generati
   */
  private async getOrCreateSystemClient(): Promise<DatabaseClient> {
    try {
      const clients = await clientService.findAllClients();
      const systemClient = clients.find(client => client.name === 'Sistema OCR');

      if (systemClient) {
        return systemClient;
      }

      // Crea cliente sistema
      const systemClientData = {
        name: 'Sistema OCR',
        vatNumber: 'SYSTEM_OCR_AUTO',
        address: 'Auto-generato',
        city: 'Sistema',
        email: 'system@ocr.local',
      };

      return await clientService.createClient(systemClientData);
    } catch (error) {
      console.error('Errore creazione cliente sistema:', error);
      throw new HttpException(500, 'Errore creazione cliente sistema');
    }
  }

  /**
   * Cleanup del servizio OCR
   */
  public async cleanup(): Promise<void> {
    await this.ocrService.cleanup();
  }
}

// Esporta un'istanza singleton del controller
export const ocrController = new OCRController();

// Esporta le funzioni del controller per l'uso nelle routes
export const extractFromPDF = ocrController.extractFromPDF;
export const createFromExtractedData = ocrController.createFromExtractedData;
export const processAndCreate = ocrController.processAndCreate;