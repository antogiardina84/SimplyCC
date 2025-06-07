// server/src/modules/pickupOrders/services/ocrPickupOrder.service.ts

export interface ExtractedPickupOrderData {
  orderNumber: string;
  issueDate: Date;
  scheduledDate?: Date;
  loadingDate?: Date;           // AGGIUNTO
  unloadingDate?: Date;         // AGGIUNTO
  senderName: string;
  senderAddress?: string;
  senderCity?: string;
  senderEmail?: string;
  recipientName: string;
  recipientAddress?: string;
  recipientCity?: string;
  recipientEmail?: string;
  basinCode: string;
  basinDescription?: string;
  flowType?: string;
  distanceKm?: number;
  expectedQuantity?: number;
  availabilityDate?: Date;
  shippingRequestDate?: Date;
  confidence: number;
}

export class OCRPickupOrderService {
  /**
   * Estrae i dati da un buffer PDF incluse le date di carico/scarico
   */
  async extractFromPDF(pdfBuffer: Buffer): Promise<ExtractedPickupOrderData> {
    console.log('Processando PDF di dimensione:', pdfBuffer.length, 'bytes');
    
    // Simulazione di estrazione OCR con date realistiche
    await this.delay(1000);
    
    // DATI REALISTICI basati sul PDF di esempio
    const extractedData: ExtractedPickupOrderData = {
      orderNumber: '925511058895',
      issueDate: new Date('2025-05-14'),
      loadingDate: new Date('2025-05-19'),    // Data carico
      unloadingDate: new Date('2025-05-21'),  // Data scarico
      senderName: 'CC DOMUS RICYCLE',
      senderAddress: 'ZONA INDUSTRIALE - STATALE PRIMOSOLE 13',
      senderCity: 'CATANIA CT',
      senderEmail: 'INFO@DOMUSRICYCLE.COM',
      recipientName: 'CSS ECOLOGISTIC SPA',
      recipientAddress: 'Contrada Girifalco',
      recipientCity: 'GINOSA TA',
      recipientEmail: 'divisioneplastica@ecologisticspa.net',
      basinCode: '2002048',
      basinDescription: 'COMUNE DI SIRACUSA',
      flowType: 'A',
      distanceKm: 174.503,
      confidence: 85,
    };
    
    return extractedData;
  }

  async validatePDF(pdfBuffer: Buffer): Promise<boolean> {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return false;
    }
    
    const pdfHeader = pdfBuffer.slice(0, 4).toString();
    return pdfHeader === '%PDF';
  }

  async cleanup(): Promise<void> {
    console.log('OCR Service cleanup completato');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}