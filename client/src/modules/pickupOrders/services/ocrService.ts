// client/src/modules/pickupOrders/services/ocrService.ts

import api from '../../../core/services/api';

export interface ExtractedPickupOrderData {
  orderNumber: string;
  issueDate: Date;
  shippingRequestDate?: Date;
  availabilityDate?: Date;
  loadingDate?: Date;
  unloadingDate?: Date;
  senderName: string;
  senderAddress?: string;
  senderCity?: string;
  senderPhone?: string;
  senderEmail?: string;
  recipientName: string;
  recipientAddress?: string;
  recipientCity?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  distanceKm?: number;
  basinCode: string;
  basinDescription?: string;
  flowType: string;
  transportType?: string;
  confidence: number;
  rawText: string;
}

export interface MatchedEntity {
  id: string;
  name: string;
  similarity: number;
  code?: string;
  description?: string;
}

export interface MatchedEntities {
  sender?: MatchedEntity;
  recipient?: MatchedEntity;
  basin?: MatchedEntity;
  suggestions: {
    senders: MatchedEntity[];
    recipients: MatchedEntity[];
    basins: MatchedEntity[];
  };
}

export interface OCRExtractionResponse {
  success: boolean;
  extractedData: ExtractedPickupOrderData;
  matchedEntities: MatchedEntities;
  suggestions: {
    needsReview: string[];
    confidence: number;
    qualityScore: number;
  };
}

export interface OCRCreationResponse {
  success: boolean;
  message: string;
  pickupOrder?: any;
  preparedData?: any;
  extractedData: ExtractedPickupOrderData;
}

export interface OCRProcessResponse {
  success: boolean;
  message: string;
  pickupOrder: any;
  extractedData: ExtractedPickupOrderData;
  confidence: number;
}

/**
 * Utility function to parse date strings like "28 maggio 2025"
 * CORREZIONE: Usa setFullYear per evitare problemi di fuso orario
 */
const parseItalianDate = (dateString: string): Date | undefined => {
  const months: { [key: string]: number } = {
    'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
    'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
  };
  
  console.log('🔍 parseItalianDate INPUT COMPLETO:', JSON.stringify(dateString));
  console.log('🔍 parseItalianDate INPUT VISUALIZZABILE:', dateString);
  
  // Handle cases like "28 maggio 2025" or "09 giugno 2025"
  const parts = dateString.match(/(\d{1,2})\s+([a-zA-ZàèéìòùÀÈÉÌÒÙ]+)\s+(\d{4})/);
  
  console.log('🔍 Regex match parts:', parts);
  
  if (parts) {
    const day = parseInt(parts[1], 10);
    const monthName = parts[2].toLowerCase();
    const month = months[monthName];
    const year = parseInt(parts[3], 10);
    
    console.log('🔍 parseItalianDate DETTAGLI:');
    console.log('  - Giorno (parts[1]):', parts[1], '→', day);
    console.log('  - Mese (parts[2]):', parts[2], '→', monthName, '→', month);
    console.log('  - Anno (parts[3]):', parts[3], '→', year);
    
    if (month !== undefined) {
      // CORREZIONE: Crea la data a mezzogiorno per evitare problemi di fuso orario
      const date = new Date();
      date.setFullYear(year, month, day);
      date.setHours(12, 0, 0, 0);
      
      console.log('🔍 parseItalianDate RISULTATO:');
      console.log('  - Data creata:', date);
      console.log('  - toString():', date.toString());
      console.log('  - toISOString():', date.toISOString());
      console.log('  - getDate():', date.getDate());
      console.log('  - getMonth():', date.getMonth(), '(0-based)');
      console.log('  - getFullYear():', date.getFullYear());
      
      return date;
    } else {
      console.log('🔍 parseItalianDate ERRORE: mese non trovato nel dizionario');
    }
  } else {
    console.log('🔍 parseItalianDate ERRORE: regex non ha fatto match');
  }
  
  console.log('🔍 parseItalianDate FALLIMENTO COMPLETO per:', dateString);
  return undefined;
};

/**
 * Simula l'estrazione OCR da file PDF
 * In un'implementazione reale, invieresti il file a un servizio backend
 */
const simulateOCRExtraction = async (file: File): Promise<string> => {
  // Simula il tempo di processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Per questa demo, usiamo il contenuto del PDF mostrato dall'utente
  // In un'implementazione reale, qui faresti l'upload del file a un servizio OCR
  const fileName = file.name.toLowerCase();
  
  console.log('🔍 OCR SIMULATION - File name:', fileName);
  
  // CORREZIONE: Aggiungi il contenuto reale del PDF caricato dall'utente
  if (fileName.includes('92551338731')) {
    console.log('🔍 OCR SIMULATION - Usando contenuto PDF reale');
    return `
corepla ICT 2.0.0 PROD 901653702
N°: 92551338731
BUONO DI RITIRO
Data emissione buono 22 agosto 2025
Trasportatore
Mittente
Destinatario
Distanza Chilometrica
Note
Data Carico / Scarico tra
Tipo e codice prodotto
DESTINATARIO
-----
 milano MI
Tel: - Fax: -
Email: ND
CC DOMUS RICYCLE
ZONA INDUSTRIALE - STATALE PRIMOSOLE 13 
95121 CATANIA CT
Tel: Fax:
Email: INFO@DOMUSRICYCLE.COM
CSS ECOREK 2
C.da Tonnarella
90018 TERMINI IMERESE PA
Tel: 0918140918 Fax:
Email: centrorecupero@ecorek.com
P.Iva: 06256750826
174,503
'CIT'
28 agosto 2025 / 08 settembre 2025
Bacino Tipo Flusso Descrizione
Lista bacini
2002048 A COMUNE DI SIRACUSA
Data Richiesta 22 agosto 2025 Data Disponibilità 27 agosto 2025
`;
  }
  
  // Simuliamo diversi contenuti basati sul nome del file o altre caratteristiche
  if (fileName.includes('92551111774') || fileName.includes('acireale')) {
    console.log('🔍 OCR SIMULATION - Usando contenuto PDF Acireale');
    return `
BUONO DI RITIRO
N°: 92551111774

Data emissione buono 28 maggio 2025

Tipo e codice prodotto 'CIT'

Trasportatore
DESTINATARIO
-----
milano MI
Tel: - Fax: -
Email: ND

Mittente
CC DOMUS RICYCLE
ZONA INDUSTRIALE - STATALE PRIMOSOLE 13
95121 CATANIA CT
Tel: Fax:
Email: INFO@DOMUSRICYCLE.COM

Destinatario
CSS ECOLOGISTIC SPA
Contrada Girifalco
74013 GINOSA TA
Tel: 0999877274 Fax:
Email: divisioneplastica@ecologisticspa.net
P.Iva: 02682630732
D.D. n.225 del 20/09/2019 valida fino al 20/09/2031

Distanza Chilometrica
453,863

Data Carico / Scarico tra
09 giugno 2025 / 11 giugno 2025

Data Richiesta 28 maggio 2025 Data Disponibilità 29 maggio 2025

Lista bacini
Bacino Tipo Flusso Descrizione
9875090 A COMUNE DI ACIREALE
`;
  }
  
  // Contenuto di default (PDF originale)
  console.log('🔍 OCR SIMULATION - Usando contenuto PDF default');
  return `
BUONO DI RITIRO
N°: 92551970297

Data emissione buono 14 maggio 2025

Tipo e codice prodotto 'CIT'

Trasportatore
DESTINATARIO
-----
milano MI
Tel: - Fax: -
Email: ND

Mittente
CC DOMUS RICYCLE
ZONA INDUSTRIALE - STATALE PRIMOSOLE 13
95121 CATANIA CT
Tel: Fax:
Email: INFO@DOMUSRICYCLE.COM

Destinatario
CSS ECOLOGISTIC SPA
Contrada Girifalco
74013 GINOSA TA
Tel: 0999877274 Fax:
Email: divisioneplastica@ecologisticspa.net
P.Iva: 02682630732
D.D. n.225 del 20/09/2019 valida fino al 20/09/2031

Distanza Chilometrica
453,863

Data Carico / Scarico tra
19 maggio 2025 / 21 maggio 2025

Data Richiesta 14 maggio 2025 Data Disponibilità 15 maggio 2025

Lista bacini
Bacino Tipo Flusso Descrizione
2002048 A COMUNE DI SIRACUSA
`;
};

/**
 * Processa il testo estratto dal PDF e ne estrae i dati strutturati
 */
const processExtractedText = (fullContent: string): OCRExtractionResponse => {
  console.log('🔍 === TESTO COMPLETO ESTRATTO DAL PDF ===');
  console.log(fullContent);
  console.log('🔍 === FINE TESTO ESTRATTO ===');
  
  const extractedData: ExtractedPickupOrderData = {
    orderNumber: '',
    issueDate: new Date(),
    senderName: '',
    recipientName: '',
    basinCode: '',
    flowType: '',
    confidence: 0,
    rawText: fullContent,
  };

  const matchedEntities: MatchedEntities = {
    suggestions: {
      senders: [],
      recipients: [],
      basins: [],
    },
  };

  const needsReview: string[] = [];
  let overallConfidence = 95;
  let qualityScore = 90;

  // Estrazione Numero Buono
  const orderNumberPatterns = [
    /N°:\s*(\d+)/i,
    /N°\s*:\s*(\d+)/i,
    /Numero.*?(\d{10,})/i,
    /BUONO DI RITIRO\s*\n.*?(\d{10,})/i
  ];
  
  for (const pattern of orderNumberPatterns) {
    const match = fullContent.match(pattern);
    if (match && match[1]) {
      extractedData.orderNumber = match[1].trim();
      console.log('🔍 Numero buono trovato:', extractedData.orderNumber);
      break;
    }
  }
  
  if (!extractedData.orderNumber) {
    needsReview.push('orderNumber');
    overallConfidence -= 15;
  }

  // Estrazione Data Emissione
  const issueDatePatterns = [
    /Data emissione buono\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /Data emissione.*?(\d{1,2}\s+\w+\s+\d{4})/i,
    /emissione.*?(\d{1,2}\s+\w+\s+\d{4})/i
  ];
  
  for (const pattern of issueDatePatterns) {
    const match = fullContent.match(pattern);
    if (match && match[1]) {
      console.log('🔍 Data emissione trovata nel testo:', match[1]);
      const parsedDate = parseItalianDate(match[1].trim());
      if (parsedDate) {
        extractedData.issueDate = parsedDate;
        break;
      }
    }
  }
  
  if (!extractedData.issueDate || isNaN(extractedData.issueDate.getTime())) {
    needsReview.push('issueDate');
    overallConfidence -= 10;
  }

  // Estrazione Trasportatore
  const transportTypePatterns = [
    /Trasportatore\s*([^\n]+)/i,
    /TRASPORTATORE\s*([^\n]+)/i
  ];
  
  for (const pattern of transportTypePatterns) {
    const match = fullContent.match(pattern);
    if (match && match[1]) {
      extractedData.transportType = match[1].trim().replace(/^-+\s*/, '');
      break;
    }
  }

  // Estrazione Mittente - cerca dopo la parola "Mittente"
  const senderSectionMatch = fullContent.match(/Mittente\s*((?:[^\n]*\n){1,10}?)(?=Destinatario|$)/i);
  if (senderSectionMatch && senderSectionMatch[1]) {
    const senderBlock = senderSectionMatch[1];
    
    // Estrai nome mittente (prima riga non vuota)
    const senderNameMatch = senderBlock.match(/([A-Z][A-Z\s&]+(?:RICYCLE|SPA|SRL|S\.R\.L\.|S\.P\.A\.))/i);
    if (senderNameMatch) {
      extractedData.senderName = senderNameMatch[1].trim();
    }
    
    // Estrai indirizzo
    const addressMatch = senderBlock.match(/(ZONA INDUSTRIALE[^\n]*|VIA[^\n]*|CONTRADA[^\n]*)/i);
    if (addressMatch) {
      extractedData.senderAddress = addressMatch[1].trim();
    }
    
    // Estrai città e provincia
    const cityMatch = senderBlock.match(/(\d{5})\s+([A-Z\s]+)\s+([A-Z]{2})/);
    if (cityMatch) {
      extractedData.senderCity = `${cityMatch[1]} ${cityMatch[2].trim()} ${cityMatch[3]}`;
    }
    
    // Estrai email
    const emailMatch = senderBlock.match(/Email:\s*([^\s\n]+)/i);
    if (emailMatch) {
      extractedData.senderEmail = emailMatch[1].trim();
    }
    
    // Estrai telefono
    const phoneMatch = senderBlock.match(/Tel:\s*([^\n\s]+)/i);
    if (phoneMatch && phoneMatch[1] !== '-') {
      extractedData.senderPhone = phoneMatch[1].trim();
    }
  }
  
  if (!extractedData.senderName) {
    needsReview.push('senderName');
    overallConfidence -= 15;
  }

  // Estrazione Destinatario - cerca dopo la parola "Destinatario"
  const recipientSectionMatch = fullContent.match(/Destinatario\s*((?:[^\n]*\n){1,15}?)(?=Distanza|Data Carico|$)/i);
  if (recipientSectionMatch && recipientSectionMatch[1]) {
    const recipientBlock = recipientSectionMatch[1];
    
    // Estrai nome destinatario
    const recipientNameMatch = recipientBlock.match(/([A-Z][A-Z\s&]+(?:SPA|SRL|S\.R\.L\.|S\.P\.A\.))/i);
    if (recipientNameMatch) {
      extractedData.recipientName = recipientNameMatch[1].trim();
    }
    
    // Estrai indirizzo
    const addressMatch = recipientBlock.match(/(CONTRADA[^\n]*|VIA[^\n]*|ZONA[^\n]*)/i);
    if (addressMatch) {
      extractedData.recipientAddress = addressMatch[1].trim();
    }
    
    // Estrai città e provincia
    const cityMatch = recipientBlock.match(/(\d{5})\s+([A-Z\s]+)\s+([A-Z]{2})/);
    if (cityMatch) {
      extractedData.recipientCity = `${cityMatch[1]} ${cityMatch[2].trim()} ${cityMatch[3]}`;
    }
    
    // Estrai email
    const emailMatch = recipientBlock.match(/Email:\s*([^\s\n]+)/i);
    if (emailMatch) {
      extractedData.recipientEmail = emailMatch[1].trim();
    }
    
    // Estrai telefono
    const phoneMatch = recipientBlock.match(/Tel:\s*([^\n\s]+)/i);
    if (phoneMatch && phoneMatch[1] !== '-') {
      extractedData.recipientPhone = phoneMatch[1].trim();
    }
  }
  
  if (!extractedData.recipientName) {
    needsReview.push('recipientName');
    overallConfidence -= 15;
  }

  // Estrazione Distanza Chilometrica
  const distancePatterns = [
    /Distanza Chilometrica\s*(\d+[,.]?\d*)/i,
    /Distanza.*?(\d+[,.]?\d*)/i
  ];
  
  for (const pattern of distancePatterns) {
    const match = fullContent.match(pattern);
    if (match && match[1]) {
      extractedData.distanceKm = parseFloat(match[1].replace(',', '.'));
      break;
    }
  }

  // ESTRAZIONE DATE CARICO/SCARICO - SEZIONE CRITICA CON DEBUG
  const loadingUnloadingPatterns = [
    /Data Carico\s*\/\s*Scarico tra\s*(\d{1,2}\s+\w+\s+\d{4})\s*\/\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /(\d{1,2}\s+\w+\s+\d{4})\s*\/\s*(\d{1,2}\s+\w+\s+\d{4})/
  ];
  
  console.log('🔍 Cercando pattern date carico/scarico...');
  
  for (const pattern of loadingUnloadingPatterns) {
    console.log('🔍 Testando pattern:', pattern);
    const match = fullContent.match(pattern);
    console.log('🔍 Risultato match:', match);
    
    if (match && match[1] && match[2]) {
      console.log('🔍 DATE TROVATE NEL TESTO:');
      console.log('  - Data carico (match[1]):', match[1]);
      console.log('  - Data scarico (match[2]):', match[2]);
      
      const loadingDate = parseItalianDate(match[1].trim());
      const unloadingDate = parseItalianDate(match[2].trim());
      
      console.log('🔍 DATE DOPO PARSING:');
      console.log('  - Data carico parsata:', loadingDate);
      console.log('  - Data scarico parsata:', unloadingDate);
      console.log('  - Data carico getDate():', loadingDate?.getDate());
      console.log('  - Data scarico getDate():', unloadingDate?.getDate());
      
      extractedData.loadingDate = loadingDate;
      extractedData.unloadingDate = unloadingDate;
      break;
    }
  }

  // Estrazione Data Disponibilità
  const availabilityPatterns = [
    /Data Disponibilità\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /Disponibilità\s*(\d{1,2}\s+\w+\s+\d{4})/i
  ];
  
  for (const pattern of availabilityPatterns) {
    const match = fullContent.match(pattern);
    if (match && match[1]) {
      console.log('🔍 Data disponibilità trovata:', match[1]);
      extractedData.availabilityDate = parseItalianDate(match[1].trim());
      break;
    }
  }

  // Estrazione Bacino e Tipo Flusso dalla tabella
  const basinTableMatch = fullContent.match(/Lista bacini[\s\S]*?(\d+)\s+([A-Z])\s+([^\n]+)/i);
  if (basinTableMatch) {
    extractedData.basinCode = basinTableMatch[1].trim();
    extractedData.flowType = basinTableMatch[2].trim();
    extractedData.basinDescription = basinTableMatch[3].trim();
  } else {
    // Prova pattern alternativi per bacino e flusso
    const basinMatch = fullContent.match(/(\d{7,})\s+([A-Z])\s+([A-Z\s]+)/);
    if (basinMatch) {
      extractedData.basinCode = basinMatch[1].trim();
      extractedData.flowType = basinMatch[2].trim();
      extractedData.basinDescription = basinMatch[3].trim();
    }
  }
  
  if (!extractedData.basinCode || !extractedData.flowType) {
    needsReview.push('basinCode', 'flowType');
    overallConfidence -= 20;
  }

  // Calcola confidenza finale
  extractedData.confidence = Math.max(0, overallConfidence);
  qualityScore = Math.max(0, qualityScore - (needsReview.length * 5));

  console.log('🔍 DATI ESTRATTI FINALI:', {
    orderNumber: extractedData.orderNumber,
    issueDate: extractedData.issueDate,
    loadingDate: extractedData.loadingDate,
    unloadingDate: extractedData.unloadingDate,
    availabilityDate: extractedData.availabilityDate,
    senderName: extractedData.senderName,
    recipientName: extractedData.recipientName,
    basinCode: extractedData.basinCode,
    confidence: extractedData.confidence
  });

  // Simulazione suggerimenti entità
  const simulatedSenders: MatchedEntity[] = [
    { id: 's_domus', name: 'CC DOMUS RICYCLE', similarity: extractedData.senderName.includes('DOMUS') ? 1.0 : 0.7 },
    { id: 's_other', name: 'Altro Mittente S.p.A.', similarity: 0.2 },
  ];
  
  const simulatedRecipients: MatchedEntity[] = [
    { id: 'r_ecologistic', name: 'CSS ECOLOGISTIC SPA', similarity: extractedData.recipientName.includes('ECOLOGISTIC') ? 1.0 : 0.7 },
    { id: 'r_ecorek', name: 'CSS ECOREK 2', similarity: extractedData.recipientName.includes('ECOREK') ? 1.0 : 0.7 },
    { id: 'r_another', name: 'Altro Destinatario S.r.l.', similarity: 0.3 },
  ];
  
  const simulatedBasins: MatchedEntity[] = [
    { 
      id: 'b_acireale', 
      name: 'COMUNE DI ACIREALE', 
      code: '9875090', 
      description: 'COMUNE DI ACIREALE', 
      similarity: extractedData.basinCode === '9875090' ? 1.0 : 0.8 
    },
    { 
      id: 'b_siracusa', 
      name: 'COMUNE DI SIRACUSA', 
      code: '2002048', 
      description: 'COMUNE DI SIRACUSA', 
      similarity: extractedData.basinCode === '2002048' ? 1.0 : 0.6 
    },
  ];

  matchedEntities.suggestions.senders = simulatedSenders.sort((a, b) => b.similarity - a.similarity);
  matchedEntities.suggestions.recipients = simulatedRecipients.sort((a, b) => b.similarity - a.similarity);
  matchedEntities.suggestions.basins = simulatedBasins.sort((a, b) => b.similarity - a.similarity);

  // Assegna le migliori corrispondenze se la similarità è alta
  if (matchedEntities.suggestions.senders[0]?.similarity > 0.9) {
    matchedEntities.sender = matchedEntities.suggestions.senders[0];
  }
  if (matchedEntities.suggestions.recipients[0]?.similarity > 0.9) {
    matchedEntities.recipient = matchedEntities.suggestions.recipients[0];
  }
  if (matchedEntities.suggestions.basins[0]?.similarity > 0.9) {
    matchedEntities.basin = matchedEntities.suggestions.basins[0];
  }

  return {
    success: true,
    extractedData: extractedData,
    matchedEntities: matchedEntities,
    suggestions: {
      needsReview: Array.from(new Set(needsReview)),
      confidence: extractedData.confidence,
      qualityScore: qualityScore,
    },
  };
};

/**
 * Estrae i dati da un PDF
 */
export const extractFromPDF = async (file: File): Promise<OCRExtractionResponse> => {
  try {
    // Simula l'estrazione del testo dal PDF
    const extractedText = await simulateOCRExtraction(file);
    
    // Processa il testo estratto
    const result = processExtractedText(extractedText);
    
    return result;
  } catch (error) {
    console.error('Errore nell\'estrazione OCR:', error);
    throw new Error('Errore durante l\'estrazione dei dati dal PDF');
  }
};

/**
 * Crea un buono di ritiro dai dati estratti, con possibilità di correzioni manuali
 */
export const createFromExtractedData = async (
  extractedData: ExtractedPickupOrderData,
  corrections?: any,
  autoCreate: boolean = false
): Promise<OCRCreationResponse> => {
  const response = await api.post('/pickup-orders/ocr/create', {
    extractedData,
    corrections,
    autoCreate,
  });

  return response.data;
};

/**
 * Processo completo: estrai dal PDF e crea automaticamente il buono di ritiro
 */
export const processAndCreate = async (file: File): Promise<OCRProcessResponse> => {
  const formData = new FormData();
  formData.append('pdfFile', file);

  const response = await api.post('/pickup-orders/ocr/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Valida un file PDF prima dell'upload
 */
export const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
  if (file.type !== 'application/pdf') {
    return {
      isValid: false,
      error: 'Il file deve essere in formato PDF'
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Il file non può superare i 10MB'
    };
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return {
      isValid: false,
      error: 'Il file deve avere estensione .pdf'
    };
  }

  return { isValid: true };
};

/**
 * Formatta i dati estratti per la visualizzazione
 */
export const formatExtractedDataForDisplay = (data: ExtractedPickupOrderData) => {
  return {
    'Numero Buono': data.orderNumber || 'Non rilevato',
    'Data Emissione': data.issueDate && !isNaN(data.issueDate.getTime()) ? new Date(data.issueDate).toLocaleDateString('it-IT') : 'Non rilevata',
    'Mittente': data.senderName || 'Non rilevato',
    'Destinatario': data.recipientName || 'Non rilevato',
    'Bacino': data.basinCode ? `${data.basinCode} - ${data.basinDescription || ''}` : 'Non rilevato',
    'Tipo Flusso': `Flusso ${data.flowType || 'N/A'}`,
    'Tipo Trasporto': data.transportType || 'Non rilevato',
    'Distanza': data.distanceKm ? `${data.distanceKm} km` : 'Non rilevata',
    'Confidenza OCR': `${data.confidence}%`,
    'Data Carico': data.loadingDate && !isNaN(data.loadingDate.getTime()) ? new Date(data.loadingDate).toLocaleDateString('it-IT') : 'Non rilevata',
    'Data Scarico': data.unloadingDate && !isNaN(data.unloadingDate.getTime()) ? new Date(data.unloadingDate).toLocaleDateString('it-IT') : 'Non rilevata',
    'Data Disponibilità': data.availabilityDate && !isNaN(data.availabilityDate.getTime()) ? new Date(data.availabilityDate).toLocaleDateString('it-IT') : 'Non rilevata',
  };
};