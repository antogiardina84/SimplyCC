// ======================================
// Test del sistema OCR
// ======================================

// server/src/tests/ocr.test.ts
/*
import { OCRPickupOrderService } from '../modules/pickupOrders/services/ocrPickupOrder.service';
import * as fs from 'fs';
import * as path from 'path';

describe('OCR Service', () => {
  let ocrService: OCRPickupOrderService;

  beforeAll(() => {
    ocrService = new OCRPickupOrderService();
  });

  afterAll(async () => {
    await ocrService.cleanup();
  });

  test('should extract data from PDF', async () => {
    // Carica un PDF di test
    const testPdfPath = path.join(__dirname, 'fixtures', 'test-buono-ritiro.pdf');
    const pdfBuffer = fs.readFileSync(testPdfPath);

    const result = await ocrService.extractFromPDF(pdfBuffer);

    expect(result).toBeDefined();
    expect(result.orderNumber).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.issueDate).toBeInstanceOf(Date);
  });

  test('should handle invalid PDF', async () => {
    const invalidBuffer = Buffer.from('not a pdf');

    await expect(ocrService.extractFromPDF(invalidBuffer))
      .rejects
      .toThrow();
  });
});
*/
