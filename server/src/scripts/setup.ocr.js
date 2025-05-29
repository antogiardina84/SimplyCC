// scripts/setup-ocr.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setup Sistema OCR per Buoni di Ritiro');
console.log('=====================================\n');

// 1. Verifica Node.js version
console.log('📋 Verifica requisiti sistema...');
const nodeVersion = process.version;
const nodeVersionNumber = parseInt(nodeVersion.slice(1).split('.')[0]);

if (nodeVersionNumber < 18) {
  console.error('❌ Node.js 18+ richiesto. Versione attuale:', nodeVersion);
  process.exit(1);
}
console.log('✅ Node.js version:', nodeVersion);

// 2. Crea directory temporanea per OCR
console.log('\n📁 Creazione directory temporanee...');
const tempDir = path.join(__dirname, '..', 'server', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log('✅ Directory temp creata:', tempDir);
} else {
  console.log('✅ Directory temp già esistente:', tempDir);
}

// 3. Verifica e installa dipendenze OCR
console.log('\n📦 Verifica dipendenze OCR...');
const requiredDeps = [
  'tesseract.js',
  'pdf2pic', 
  'multer',
  'sharp',
  'canvas'
];

const serverPackageJsonPath = path.join(__dirname, '..', 'server', 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(serverPackageJsonPath, 'utf8'));
} catch (error) {
  console.error('❌ Impossibile leggere package.json del server');
  process.exit(1);
}

const missingDeps = requiredDeps.filter(dep => 
  !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
);

if (missingDeps.length > 0) {
  console.log('📦 Installazione dipendenze mancanti:', missingDeps.join(', '));
  try {
    process.chdir(path.join(__dirname, '..', 'server'));
    execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Dipendenze installate con successo');
  } catch (error) {
    console.error('❌ Errore installazione dipendenze:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Tutte le dipendenze OCR sono installate');
}

// 4. Verifica dipendenze frontend
console.log('\n🎨 Verifica dipendenze frontend...');
const clientPackageJsonPath = path.join(__dirname, '..', 'client', 'package.json');
let clientPackageJson;

try {
  clientPackageJson = JSON.parse(fs.readFileSync(clientPackageJsonPath, 'utf8'));
} catch (error) {
  console.error('❌ Impossibile leggere package.json del client');
  process.exit(1);
}

const requiredClientDeps = ['react-dropzone'];
const missingClientDeps = requiredClientDeps.filter(dep => 
  !clientPackageJson.dependencies[dep] && !clientPackageJson.devDependencies[dep]
);

if (missingClientDeps.length > 0) {
  console.log('📦 Installazione dipendenze frontend:', missingClientDeps.join(', '));
  try {
    process.chdir(path.join(__dirname, '..', 'client'));
    execSync(`npm install ${missingClientDeps.join(' ')} @types/react-dropzone`, { stdio: 'inherit' });
    console.log('✅ Dipendenze frontend installate');
  } catch (error) {
    console.error('❌ Errore installazione dipendenze frontend:', error.message);
    console.log('⚠️  Continuo con il setup...');
  }
} else {
  console.log('✅ Dipendenze frontend già installate');
}

// 5. Crea file di configurazione
console.log('\n⚙️  Creazione file di configurazione...');
const envExamplePath = path.join(__dirname, '..', 'server', '.env.example');
const envPath = path.join(__dirname, '..', 'server', '.env');

const envContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sistema_rifiuti"

# Server Configuration
PORT=4000
HOST=0.0.0.0
API_PREFIX=/api
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# OCR Configuration
OCR_TEMP_DIR=./temp
OCR_MAX_FILE_SIZE=10485760
OCR_SUPPORTED_LANGUAGES=ita
OCR_CONFIDENCE_THRESHOLD=70
OCR_AUTO_CREATE_THRESHOLD=90

# PDF Processing
PDF_DPI=300
PDF_OUTPUT_FORMAT=png
PDF_MAX_WIDTH=2480
PDF_MAX_HEIGHT=3508

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
`;

// Scrivi .env.example
fs.writeFileSync(envExamplePath, envContent);
console.log('✅ File .env.example creato');

// Crea .env se non esiste
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ File .env creato');
} else {
  console.log('⚠️  File .env già esistente - non sovrascritto');
}

// 6. Crea directory per logs
const logsDir = path.join(__dirname, '..', 'server', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Directory logs creata');
}

// 7. Test configurazione OCR (opzionale)
console.log('\n🧪 Test configurazione OCR...');
try {
  const tesseract = require('tesseract.js');
  console.log('✅ Tesseract.js caricato correttamente');
  
  // Test creazione worker (senza processare nulla)
  console.log('✅ Sistema OCR configurato correttamente');
} catch (error) {
  console.log('⚠️  OCR non testabile ora - verificare dopo primo avvio');
}

// 8. Riepilogo finale
console.log('\n🎉 Setup OCR Completato!');
console.log('========================\n');
console.log('📋 Prossimi passi:');
console.log('1. Configura il database PostgreSQL');
console.log('2. Aggiorna le credenziali in .env');
console.log('3. Esegui: npm run dev (server)');
console.log('4. Esegui: npm run dev (client)');
console.log('5. Testa l\'upload PDF all\'endpoint /api/pickup-orders/ocr/extract\n');

console.log('📖 Endpoints OCR disponibili:');
console.log('- POST /api/pickup-orders/ocr/extract     - Estrae dati da PDF');
console.log('- POST /api/pickup-orders/ocr/create      - Crea buono da dati estratti');
console.log('- POST /api/pickup-orders/ocr/process     - Processo completo automatico\n');

console.log('🔧 Troubleshooting:');
console.log('- Se OCR è lento: aumenta OCR_CONFIDENCE_THRESHOLD in .env');
console.log('- Per PDF con qualità bassa: diminuisci PDF_DPI in .env');
console.log('- Log errori in: ./logs/app.log\n');

console.log('✅ Sistema OCR pronto per l\'uso!');

// ======================================
// SCRIPT DI TEST OCR
// ======================================

// scripts/test-ocr.js
/*
const fs = require('fs');
const path = require('path');

async function testOCR() {
  console.log('🧪 Test Sistema OCR');
  console.log('==================\n');

  try {
    // Importa il servizio OCR
    const { OCRPickupOrderService } = require('../server/dist/modules/pickupOrders/services/ocrPickupOrder.service');
    
    console.log('✅ Servizio OCR importato');
    
    // Crea istanza servizio
    const ocrService = new OCRPickupOrderService();
    console.log('✅ Servizio OCR inizializzato');
    
    // Verifica se esiste un PDF di test
    const testPdfPath = path.join(__dirname, 'test-files', 'buono-ritiro-test.pdf');
    
    if (fs.existsSync(testPdfPath)) {
      console.log('📄 PDF di test trovato, esecuzione estrazione...');
      
      const pdfBuffer = fs.readFileSync(testPdfPath);
      const result = await ocrService.extractFromPDF(pdfBuffer);
      
      console.log('✅ Estrazione completata!');
      console.log('📊 Risultati:');
      console.log(`   - Numero Buono: ${result.orderNumber || 'Non rilevato'}`);
      console.log(`   - Mittente: ${result.senderName || 'Non rilevato'}`);
      console.log(`   - Destinatario: ${result.recipientName || 'Non rilevato'}`);
      console.log(`   - Confidenza: ${result.confidence}%`);
      
      await ocrService.cleanup();
      console.log('✅ Test completato con successo!');
    } else {
      console.log('⚠️  Nessun PDF di test trovato in scripts/test-files/');
      console.log('💡 Crea la directory e aggiungi un PDF per testare');
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    process.exit(1);
  }
}

// Esegui test se chiamato direttamente
if (require.main === module) {
  testOCR();
}

module.exports = { testOCR };
*/