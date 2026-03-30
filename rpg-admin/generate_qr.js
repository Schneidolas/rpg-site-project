// generate_qr.js (Versão Base64, sem frescura)
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// --- O ID do jogador que você quer no QR Code ---
const PLAYER_ID = "player_schneider"; // Bota o ID de quem tu quer gerar

// 1. CODIFICA O ID EM BASE64
// 'Buffer.from...toString('base64')' é o jeito do Node.js fazer o btoa() do navegador
const base64Id = Buffer.from(PLAYER_ID).toString('base64');

console.log(`ID Original: ${PLAYER_ID}`);
console.log(`Codificado em Base64: ${base64Id}`);

// 2. GERA O QR CODE com a string Base64
const outputDir = path.join(__dirname, '..', 'docs', 'qrcodes'); // Apontando pra pasta 'docs'
const outputPath = path.join(outputDir, `${PLAYER_ID}_qr.png`);

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

QRCode.toFile(outputPath, base64Id, { type: 'png', scale: 8 }, (err) => {
    if (err) throw err;
    console.log(`✅ QR Code com Base64 gerado em: ${outputPath}`);
});