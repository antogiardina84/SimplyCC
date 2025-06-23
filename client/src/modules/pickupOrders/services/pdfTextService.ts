// client/src/modules/pickupOrders/services/pdfTextService.ts

import * as pdfjsLib from 'pdfjs-dist';

// Configurazione del worker PDF.js per Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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
  basinDescription: string;
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

export interface PDFExtractionResponse {
  success: boolean;
  extractedData: ExtractedPickupOrderData;
  matchedEntities: MatchedEntities;
  suggestions: {
    needsReview: string[];
    confidence: number;
    qualityScore: number;
  };
}

/**
 * Estrae tutto il testo da un PDF usando PDF.js
 */
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('Inizio estrazione testo dal PDF...');
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Carica il documento PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    console.log(`PDF caricato, ${pdf.numPages} pagine trovate`);
    
    // Estrai testo da tutte le pagine
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processando pagina ${pageNum}...`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Concatena tutti gli elementi di testo della pagina
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      
      fullText += pageText + '\n';
      console.log(`Pagina ${pageNum} processata, ${pageText.length} caratteri estratti`);
    }
    
    console.log(`Estrazione completata, ${fullText.length} caratteri totali`);
    return fullText;
    
  } catch (error) {
    console.error('Errore nell\'estrazione del testo dal PDF:', error);
    throw new Error('Impossibile estrarre il testo dal PDF: ' + (error as Error).message);
  }
};

/**
 * Utility function to parse date strings like "28 maggio 2025"
 */
const parseItalianDate = (dateString: string): Date | undefined => {
  const months: { [key: string]: number } = {
    'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
    'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
  };
  
  // Handle cases like "28 maggio 2025" or "09 giugno 2025"
  const parts = dateString.match(/(\d{1,2})\s+([a-zA-ZàèéìòùÀÈÉÌÒÙ]+)\s+(\d{4})/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = months[parts[2].toLowerCase()];
    const year = parseInt(parts[3], 10);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }
  return undefined;
};

/**
 * Processa il testo estratto dal PDF e ne estrae i dati strutturati
 */
const processExtractedText = (fullContent: string): PDFExtractionResponse => {
  const extractedData: ExtractedPickupOrderData = {
    orderNumber: '',
    issueDate: new Date(),
    senderName: '',
    recipientName: '',
    basinCode: '',
    basinDescription: '',
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

  // Pulisci il testo rimuovendo spazi extra e line breaks multipli
  const cleanText = fullContent.replace(/\s+/g, ' ').trim();

  console.log('Testo estratto:', cleanText);

  // Estrazione Numero Buono
  const orderNumberPatterns = [
    /N°:\s*(\d+)/i,
    /N°\s*:\s*(\d+)/i,
    /Numero.*?(\d{10,})/i,
    /BUONO DI RITIRO.*?(\d{10,})/i,
    /(\d{11})/  // Pattern generico per numeri lunghi
  ];
  
  for (const pattern of orderNumberPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      extractedData.orderNumber = match[1].trim();
      console.log('Numero buono trovato:', extractedData.orderNumber);
      break;
    }
  }
  
  if (!extractedData.orderNumber) {
    needsReview.push('orderNumber');
    overallConfidence -= 15;
    console.log('Numero buono NON trovato');
  }

  // Estrazione Data Emissione
  const issueDatePatterns = [
    /Data emissione buono\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /Data emissione.*?(\d{1,2}\s+\w+\s+\d{4})/i,
    /emissione.*?(\d{1,2}\s+\w+\s+\d{4})/i
  ];
  
  for (const pattern of issueDatePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const parsedDate = parseItalianDate(match[1].trim());
      if (parsedDate) {
        extractedData.issueDate = parsedDate;
        console.log('Data emissione trovata:', extractedData.issueDate);
        break;
      }
    }
  }
  
  if (!extractedData.issueDate || isNaN(extractedData.issueDate.getTime())) {
    needsReview.push('issueDate');
    overallConfidence -= 10;
    console.log('Data emissione NON trovata');
  }

  // Estrazione Trasportatore
  const transportTypePatterns = [
    /Trasportatore\s*([^\n]+)/i,
    /TRASPORTATORE\s*([^\n]+)/i
  ];
  
  for (const pattern of transportTypePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      extractedData.transportType = match[1].trim().replace(/^-+\s*/, '');
      console.log('Trasportatore trovato:', extractedData.transportType);
      break;
    }
  }

  // Estrazione Mittente
  const senderPatterns = [
    /Mittente\s+([A-Z][A-Z\s&]+(?:RICYCLE|SPA|SRL|S\.R\.L\.|S\.P\.A\.))/i,
    /CC\s+([A-Z][A-Z\s&]+RICYCLE)/i,
    /(DOMUS\s+RICYCLE)/i
  ];
  
  for (const pattern of senderPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      extractedData.senderName = match[1].trim();
      console.log('Mittente trovato:', extractedData.senderName);
      break;
    }
  }
  
  if (!extractedData.senderName) {
    needsReview.push('senderName');
    overallConfidence -= 15;
    console.log('Mittente NON trovato');
  }

  // Estrazione Destinatario
  const recipientPatterns = [
    /Destinatario\s+([A-Z][A-Z\s&]+(?:SPA|SRL|S\.R\.L\.|S\.P\.A\.))/i,
    /CSS\s+([A-Z][A-Z\s&]+SPA)/i,
    /(ECOLOGISTIC\s+SPA)/i
  ];
  
  for (const pattern of recipientPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      extractedData.recipientName = match[1].trim();
      console.log('Destinatario trovato:', extractedData.recipientName);
      break;
    }
  }
  
  if (!extractedData.recipientName) {
    needsReview.push('recipientName');
    overallConfidence -= 15;
    console.log('Destinatario NON trovato');
  }

  // Estrazione Distanza
  const distancePatterns = [
    /Distanza Chilometrica\s*(\d+[,.]?\d*)/i,
    /Distanza.*?(\d+[,.]?\d*)/i,
    /(\d+[,.]?\d+)\s*km/i
  ];
  
  for (const pattern of distancePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      extractedData.distanceKm = parseFloat(match[1].replace(',', '.'));
      console.log('Distanza trovata:', extractedData.distanceKm);
      break;
    }
  }

  // Estrazione Date Carico/Scarico
  const loadingPatterns = [
    /Data Carico\s*\/\s*Scarico tra\s*(\d{1,2}\s+\w+\s+\d{4})\s*\/\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /(\d{1,2}\s+\w+\s+\d{4})\s*\/\s*(\d{1,2}\s+\w+\s+\d{4})/
  ];
  
  for (const pattern of loadingPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1] && match[2]) {
      extractedData.loadingDate = parseItalianDate(match[1].trim());
      extractedData.unloadingDate = parseItalianDate(match[2].trim());
      console.log('Date carico/scarico trovate:', extractedData.loadingDate, extractedData.unloadingDate);
      break;
    }
  }

  // Estrazione Data Disponibilità
  const availabilityPatterns = [
    /Data Disponibilità\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /Disponibilità\s*(\d{1,2}\s+\w+\s+\d{4})/i
  ];
  
  for (const pattern of availabilityPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      extractedData.availabilityDate = parseItalianDate(match[1].trim());
      console.log('Data disponibilità trovata:', extractedData.availabilityDate);
      break;
    }
  }

  // Estrazione Bacino e Tipo Flusso
  const basinPatterns = [
    /Lista bacini.*?(\d{7})\s+([A-Z])\s+([A-Z\s]+)/i,
    /Bacino.*?(\d{7})\s+([A-Z])\s+([A-Z\s]+)/i,
    /(\d{7})\s+([A-Z])\s+(COMUNE\s+DI\s+[A-Z]+)/i
  ];
  
  for (const pattern of basinPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1] && match[2]) {
      extractedData.basinCode = match[1].trim();
      extractedData.flowType = match[2].trim();
      extractedData.basinDescription = match[3] ? match[3].trim() : '';
      console.log('Bacino trovato:', extractedData.basinCode, extractedData.flowType, extractedData.basinDescription);
      break;
    }
  }
  
  if (!extractedData.basinCode || !extractedData.flowType) {
    needsReview.push('basinCode', 'flowType');
    overallConfidence -= 20;
    console.log('Bacino o tipo flusso NON trovati');
  }

  // Assicurati che basinDescription sia sempre una stringa
  if (!extractedData.basinDescription) {
    extractedData.basinDescription = '';
  }

  // Calcola confidenza finale
  extractedData.confidence = Math.max(0, overallConfidence);
  qualityScore = Math.max(0, qualityScore - (needsReview.length * 5));

  // Simulazione suggerimenti entità (mantengo la stessa logica dell'OCR)
  const simulatedSenders: MatchedEntity[] = [
    { id: 's_domus', name: 'CC DOMUS RICYCLE', similarity: extractedData.senderName.includes('DOMUS') ? 1.0 : 0.7 },
    { id: 's_other', name: 'Altro Mittente S.p.A.', similarity: 0.2 },
  ];
  
  const simulatedRecipients: MatchedEntity[] = [
    { id: 'r_ecologistic', name: 'CSS ECOLOGISTIC SPA', similarity: extractedData.recipientName.includes('ECOLOGISTIC') ? 1.0 : 0.7 },
    { id: 'r_another', name: 'Altro Destinatario S.r.l.', similarity: 0.3 },
  ];
  
  const simulatedBasins: MatchedEntity[] = [
    { 
      id: 'b_siracusa', 
      name: 'COMUNE DI SIRACUSA', 
      code: '2002048', 
      description: 'COMUNE DI SIRACUSA', 
      similarity: extractedData.basinCode === '2002048' ? 1.0 : 0.6 
    },
    { 
      id: 'b_acireale', 
      name: 'COMUNE DI ACIREALE', 
      code: '9875090', 
      description: 'COMUNE DI ACIREALE', 
      similarity: extractedData.basinCode === '9875090' ? 1.0 : 0.8 
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
 * Estrae i dati da un PDF usando PDF.js (non OCR)
 */
export const extractFromPDF = async (file: File): Promise<PDFExtractionResponse> => {
  try {
    console.log('Inizio estrazione dal PDF...');
    
    // Estrai il testo dal PDF
    const extractedText = await extractTextFromPDF(file);
    console.log('Testo estratto completo:', extractedText);
    
    // Processa il testo estratto
    const result = processExtractedText(extractedText);
    
    console.log('Risultato processamento:', result);
    
    return result;
  } catch (error) {
    console.error('Errore nell\'estrazione dal PDF:', error);
    throw new Error('Errore durante l\'estrazione dei dati dal PDF: ' + (error as Error).message);
  }
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
    'Confidenza Estrazione': `${data.confidence}%`,
    'Data Carico': data.loadingDate && !isNaN(data.loadingDate.getTime()) ? new Date(data.loadingDate).toLocaleDateString('it-IT') : 'Non rilevata',
    'Data Scarico': data.unloadingDate && !isNaN(data.unloadingDate.getTime()) ? new Date(data.unloadingDate).toLocaleDateString('it-IT') : 'Non rilevata',
    'Data Disponibilità': data.availabilityDate && !isNaN(data.availabilityDate.getTime()) ? new Date(data.availabilityDate).toLocaleDateString('it-IT') : 'Non rilevata',
  };
};