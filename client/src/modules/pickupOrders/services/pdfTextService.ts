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
 * Trova tutti i numeri lunghi nel testo e li classifica per probabilità
 */
const extractAllNumbers = (text: string) => {
  const numberPatterns = [
    { pattern: /(\d{9,12})/g, type: 'long_number' },
    { pattern: /(\d{7,8})/g, type: 'medium_number' },
    { pattern: /(\d+[,.]\d+)/g, type: 'decimal_number' }
  ];
  
  const foundNumbers: Array<{ value: string; type: string; position: number }> = [];
  
  numberPatterns.forEach(({ pattern, type }) => {
    let match;
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(text)) !== null) {
      foundNumbers.push({
        value: match[1],
        type: type,
        position: match.index
      });
    }
  });
  
  return foundNumbers.sort((a, b) => a.position - b.position);
};

/**
 * Trova tutte le possibili entità aziendali nel testo
 */
const extractCompanyNames = (text: string) => {
  const companyPatterns = [
    // Pattern per aziende con prefissi comuni
    /(?:CC|CSS|SPA|SRL|S\.R\.L\.|S\.P\.A\.)\s+([A-Z][A-Z\s&]{3,30})/gi,
    // Pattern per nomi aziendali generici
    /\b([A-Z][A-Z\s&]{5,30}(?:SPA|SRL|S\.R\.L\.|S\.P\.A\.))\b/gi,
    // Pattern per nomi senza suffissi legali
    /\b([A-Z][A-Z\s]{3,20}(?:RICYCLE|PLASTIC|ECO|GREEN|AMBIENTE))\b/gi
  ];
  
  const foundCompanies: Array<{ name: string; type: string; position: number }> = [];
  
  companyPatterns.forEach((pattern, index) => {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const cleanName = match[1].trim();
      if (cleanName.length > 3) {
        foundCompanies.push({
          name: cleanName,
          type: `company_pattern_${index}`,
          position: match.index
        });
      }
    }
  });
  
  return foundCompanies.sort((a, b) => a.position - b.position);
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

  // Estrai tutti i numeri dal documento
  const allNumbers = extractAllNumbers(cleanText);
  console.log('Numeri trovati:', allNumbers);

  // Estrai tutte le aziende dal documento
  const allCompanies = extractCompanyNames(cleanText);
  console.log('Aziende trovate:', allCompanies);

  // ESTRAZIONE NUMERO BUONO - il secondo numero lungo dopo "PROD"
  const orderNumberCandidates = allNumbers
    .filter(n => n.type === 'long_number' && n.value.length >= 10 && n.value.length <= 12)
    .filter(n => n.position < cleanText.length * 0.3); // Primi 30% del documento
  
  // Cerca specificamente dopo "PROD"
  const prodPattern = /PROD\s+\d+\s+(\d{11,})/i;
  const prodMatch = cleanText.match(prodPattern);
  
  if (prodMatch && prodMatch[1]) {
    extractedData.orderNumber = prodMatch[1];
    console.log('Numero buono trovato (dopo PROD):', extractedData.orderNumber);
  } else if (orderNumberCandidates.length >= 2) {
    // Prendi il secondo numero se ci sono almeno 2 numeri
    extractedData.orderNumber = orderNumberCandidates[1].value;
    console.log('Numero buono trovato (secondo numero):', extractedData.orderNumber);
  } else if (orderNumberCandidates.length > 0) {
    extractedData.orderNumber = orderNumberCandidates[0].value;
    console.log('Numero buono trovato (primo numero):', extractedData.orderNumber);
  } else {
    needsReview.push('orderNumber');
    overallConfidence -= 15;
    console.log('Numero buono NON trovato');
  }

  // ESTRAZIONE BACINO - cerca nella sezione "Lista bacini"
  let basinCode = '';
  
  // Pattern prioritario: cerca nella sezione "Lista bacini"
  const basinListPattern = /Lista bacini\s+(\d{7})/i;
  const listMatch = cleanText.match(basinListPattern);
  
  if (listMatch && listMatch[1]) {
    basinCode = listMatch[1];
    console.log('Codice bacino trovato (Lista bacini):', basinCode);
  } else {
    // Fallback: cerca pattern "Bacino" seguito da numero
    const basinPattern = /Bacino[^0-9]*(\d{7})/i;
    const basinMatch = cleanText.match(basinPattern);
    
    if (basinMatch && basinMatch[1]) {
      basinCode = basinMatch[1];
      console.log('Codice bacino trovato (pattern Bacino):', basinCode);
    } else {
      // Ultimo fallback: cerca numeri di 7 cifre che non siano l'ordine
      const basinCandidates = allNumbers
        .filter(n => n.type === 'medium_number' && n.value.length === 7)
        .filter(n => n.value !== extractedData.orderNumber);
      
      if (basinCandidates.length > 0) {
        basinCode = basinCandidates[0].value;
        console.log('Codice bacino trovato (fallback):', basinCode);
      }
    }
  }
  
  if (basinCode) {
    extractedData.basinCode = basinCode;
  } else {
    needsReview.push('basinCode');
    overallConfidence -= 15;
    console.log('Codice bacino NON trovato');
  }

  // ESTRAZIONE DATA EMISSIONE - pattern flessibili
  const issueDatePatterns = [
    /Data emissione[^0-9]*(\d{1,2}\s+\w+\s+\d{4})/i,
    /emissione[^0-9]*(\d{1,2}\s+\w+\s+\d{4})/i,
    /(\d{1,2}\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+\d{4})/i
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

  // ESTRAZIONE MITTENTE - primo nome azienda dopo "CC" o in sezione mittente
  const senderPatterns = [
    /(?:Mittente|CC)\s+([A-Z][A-Z\s&]{3,30})(?:\s+[A-Z]{2,5}\s+[A-Z]|$)/i,
    /CC\s+([A-Z][A-Z\s&]{3,30})/i
  ];
  
  for (const pattern of senderPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      extractedData.senderName = match[1].trim();
      console.log('Mittente trovato:', extractedData.senderName);
      break;
    }
  }
  
  // Fallback: usa la prima azienda trovata se nessun pattern specifico ha funzionato
  if (!extractedData.senderName && allCompanies.length > 0) {
    extractedData.senderName = allCompanies[0].name;
    console.log('Mittente trovato (fallback):', extractedData.senderName);
    overallConfidence -= 5;
  }
  
  if (!extractedData.senderName) {
    needsReview.push('senderName');
    overallConfidence -= 15;
    console.log('Mittente NON trovato');
  }

  // ESTRAZIONE DESTINATARIO - pattern migliorati per evitare false match
  const recipientPatterns = [
    // Pattern specifico per CSS seguito da nome azienda
    /CSS\s+([A-Z][A-Z\s&]{3,30})(?:\s+Contrada|\s+Via|\s+\d{5})/i,
    // Pattern per nomi che terminano con SPA
    /CSS\s+([A-Z\s]+SPA)(?:\s+Contrada|\s+Via)/i,
    // Pattern più generico come fallback
    /(?:Destinatario.*?)?CSS\s+([A-Z][A-Z\s&]{5,30})/i
  ];
  
  for (const pattern of recipientPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const recipientName = match[1].trim();
      // Verifica che non sia una stringa generica
      if (!recipientName.includes('Distanza') && !recipientName.includes('Note') && !recipientName.includes('Data')) {
        extractedData.recipientName = recipientName;
        console.log('Destinatario trovato:', extractedData.recipientName);
        break;
      }
    }
  }
  
  // Fallback: cerca specificamente "ECOLOGISTIC SPA" o simili
  if (!extractedData.recipientName) {
    const specificRecipientPattern = /(ECOLOGISTIC\s+SPA)/i;
    const specificMatch = cleanText.match(specificRecipientPattern);
    if (specificMatch) {
      extractedData.recipientName = specificMatch[1].trim();
      console.log('Destinatario trovato (specifico):', extractedData.recipientName);
    } else {
      // Fallback finale: usa la seconda azienda diversa dal mittente
      if (allCompanies.length > 1) {
        for (const company of allCompanies) {
          if (company.name !== extractedData.senderName && 
              !company.name.includes('Distanza') && 
              !company.name.includes('Note') && 
              !company.name.includes('Data')) {
            extractedData.recipientName = company.name;
            console.log('Destinatario trovato (fallback):', extractedData.recipientName);
            overallConfidence -= 5;
            break;
          }
        }
      }
    }
  }
  
  if (!extractedData.recipientName) {
    needsReview.push('recipientName');
    overallConfidence -= 15;
    console.log('Destinatario NON trovato');
  }

  // ESTRAZIONE TIPO FLUSSO - cerca lettere singole in contesti appropriati
  const flowTypePatterns = [
    /Tipo Flusso[^A-Z]*([A-Z])\s/i,
    /Flusso[^A-Z]*([A-Z])\s/i,
    /Lista bacini[^A-Z]*([A-Z])\s/i,
    /\b([A-D])\s+Data(?:\s+Disponibilità|$)/i // Pattern più specifico
  ];
  
  for (const pattern of flowTypePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1] && /[A-D]/.test(match[1])) {
      extractedData.flowType = match[1].trim();
      console.log('Tipo flusso trovato:', extractedData.flowType);
      break;
    }
  }
  
  if (!extractedData.flowType) {
    needsReview.push('flowType');
    overallConfidence -= 10;
    console.log('Tipo flusso NON trovato');
  }

  // ESTRAZIONE DISTANZA - cerca numeri con decimali vicino a indicatori di distanza
  const distancePatterns = [
    /(\d+[,.]\d+)\s*(?:km|'CIT'|CIT)/i,
    /(?:Distanza|km)[^0-9]*(\d+[,.]\d+)/i,
    /(\d{3}[,.]\d{3})/  // Pattern per numeri con formato xxx,xxx
  ];
  
  for (const pattern of distancePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const distance = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(distance) && distance > 0 && distance < 10000) { // Validazione ragionevole
        extractedData.distanceKm = distance;
        console.log('Distanza trovata:', extractedData.distanceKm);
        break;
      }
    }
  }

  // ESTRAZIONE DESCRIZIONE BACINO - cerca "COMUNE DI" o nomi geografici
  const basinDescriptionPatterns = [
    /(COMUNE\s+DI\s+[A-Z]+)/i,
    // Pattern per nomi aziendali completi (nome + ragione sociale)
    new RegExp(`${extractedData.basinCode}\\s+([A-Z][A-Z\\s&]+(?:SRL|SPA|S\\.R\\.L\\.|S\\.P\\.A\\.))`, 'i'),
    // Pattern per qualsiasi nome prima del tipo flusso
    new RegExp(`${extractedData.basinCode}\\s+([A-Z][A-Z\\s&]{3,30})\\s+${extractedData.flowType}`, 'i'),
    // Pattern generico per nomi prima del tipo flusso
    /([A-Z][A-Z\s&]{5,30})\s+[A-Z]\s+Data/i
  ];
  
  for (const pattern of basinDescriptionPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      extractedData.basinDescription = match[1].trim();
      console.log('Descrizione bacino trovata:', extractedData.basinDescription);
      break;
    }
  }

  // ESTRAZIONE DATE CARICO/SCARICO
  const loadingPatterns = [
    /(\d{1,2}\s+\w+\s+\d{4})\s*\/\s*(\d{1,2}\s+\w+\s+\d{4})/,
    /Carico[^0-9]*(\d{1,2}\s+\w+\s+\d{4})[^0-9]*(\d{1,2}\s+\w+\s+\d{4})/i
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

  // ESTRAZIONE TRASPORTATORE - cerca testo tra apici o dopo "Trasportatore"
  const transportPatterns = [
    /'([^']{1,20})'/,
    /Trasportatore[^A-Z]*([A-Z]{2,10})/i,
    /"([^"]{1,20})"/
  ];
  
  for (const pattern of transportPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1] && match[1].trim().length > 0) {
      extractedData.transportType = match[1].trim();
      console.log('Trasportatore trovato:', extractedData.transportType);
      break;
    }
  }

  // Assicurati che basinDescription sia sempre una stringa
  if (!extractedData.basinDescription) {
    extractedData.basinDescription = '';
  }

  // Calcola confidenza finale
  extractedData.confidence = Math.max(0, overallConfidence);
  qualityScore = Math.max(0, qualityScore - (needsReview.length * 5));

  // SUGGERIMENTI DINAMICI - basati sui dati effettivamente trovati
  matchedEntities.suggestions.senders = allCompanies
    .filter(c => c.name !== extractedData.recipientName)
    .slice(0, 3)
    .map((company, index) => ({
      id: `sender_${index}`,
      name: company.name,
      similarity: company.name === extractedData.senderName ? 1.0 : 0.7 - (index * 0.1)
    }));

  matchedEntities.suggestions.recipients = allCompanies
    .filter(c => c.name !== extractedData.senderName)
    .slice(0, 3)
    .map((company, index) => ({
      id: `recipient_${index}`,
      name: company.name,
      similarity: company.name === extractedData.recipientName ? 1.0 : 0.7 - (index * 0.1)
    }));

  // Per i bacini, suggeriamo quello trovato più alcuni generici
  const basinSuggestions = [];
  if (extractedData.basinCode) {
    basinSuggestions.push({
      id: `basin_found`,
      name: extractedData.basinDescription || 'Bacino Rilevato',
      code: extractedData.basinCode,
      description: extractedData.basinDescription,
      similarity: 1.0
    });
  }
  
  matchedEntities.suggestions.basins = basinSuggestions;

  // Assegna le migliori corrispondenze
  if (matchedEntities.suggestions.senders[0]?.similarity === 1.0) {
    matchedEntities.sender = matchedEntities.suggestions.senders[0];
  }
  if (matchedEntities.suggestions.recipients[0]?.similarity === 1.0) {
    matchedEntities.recipient = matchedEntities.suggestions.recipients[0];
  }
  if (matchedEntities.suggestions.basins[0]?.similarity === 1.0) {
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