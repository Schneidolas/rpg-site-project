const fs = require('fs');
const path = require('path');

// Caminhos corretos agora apontando para a pasta DOCS
const dataDir = path.join(__dirname, 'data');
const docsDir = path.join(__dirname, '..', 'docs'); // Mudamos de rpg-players para docs
const outputPath = path.join(docsDir, 'database.json');

console.log("Iniciando compilação do Grimório para a pasta /docs...");

const finalData = {};

// Lista de arquivos JSON que precisam ser combinados
const filesToCombine = [
    'players.json', 
    'conquistas.json', 
    'insignias.json', 
    'cartas.json',
    'colecionaveis.json'
];

// Lê os arquivos do Admin
filesToCombine.forEach(fileName => {
    const filePath = path.join(dataDir, fileName);
    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const keyName = fileName.replace('.json', '');
            finalData[keyName] = JSON.parse(fileContent);
            console.log(`✅ ${fileName} incluído.`);
        } else {
            console.warn(`⚠️ Aviso: ${fileName} não encontrado na pasta /data/. Ignorando.`);
            finalData[fileName.replace('.json', '')] = []; 
        }
    } catch (e) {
        console.error(`❌ ERRO ao processar ${fileName}:`, e.message);
    }
});

// Garante que a pasta docs existe
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

// Escreve o arquivo JSON compilado direto na pasta docs
try {
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf8');
    console.log(`\n🎉 SUCESSO! O Grimório compilado foi gerado em: ${outputPath}`);
    console.log("A mágica tá pronta! Pode mandar o 'git push' sem medo!");
} catch (e) {
    console.error("❌ FALHA CRÍTICA ao escrever o database.json final.", e.message);
}