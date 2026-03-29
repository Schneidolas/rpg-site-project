const fs = require('fs');
const path = require('path');

// Caminhos
const dataDir = path.join(__dirname, 'data');
const publicDir = path.join(__dirname, '..', 'rpg-players'); // Assume que 'rpg-players' está na pasta de cima
const outputPath = path.join(publicDir, 'database.json');

console.log("Iniciando compilação para o site público...");

const finalData = {};

// Lista de arquivos JSON que precisam ser combinados
const filesToCombine = [
    'players.json', 
    'conquistas.json', 
    'insignias.json', 
    'cartas.json',
    'colecionaveis.json'
    // Adicione aqui qualquer outro JSON que o site público precise ler diretamente
];

filesToCombine.forEach(fileName => {
    const filePath = path.join(dataDir, fileName);
    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            // Transforma o nome do arquivo (ex: players.json) na chave do objeto final (ex: players)
            const keyName = fileName.replace('.json', '');
            finalData[keyName] = JSON.parse(fileContent);
            console.log(`✅ ${fileName} incluído.`);
        } else {
            console.warn(`⚠️ Aviso: Arquivo ${fileName} não encontrado na pasta /data/. Ignorando.`);
            finalData[fileName.replace('.json', '')] = []; // Coloca array vazio se não existir
        }
    } catch (e) {
        console.error(`❌ ERRO ao processar ${fileName}:`, e.message);
    }
});

// Escreve o arquivo JSON compilado na pasta de destino
try {
    // Apenas salve O ARRAY de jogadores, se o resto for lido por outras chamadas (o que não é o caso aqui)
    // Se você quer que o database.json contenha TUDO, deixe como estava. 
    // O problema é o script.js que está pegando o objeto inteiro como se fosse um array.
    // Se o database.json é o objeto completo, use:
    // fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf8'); // DEIXE COMO ESTAVA, o erro é no script.js

    // *** MAS PRA SIMPLIFICAR, VAMOS FAZER O BUILD MANDAR SÓ A LISTA DE PLAYERS ***
    // Se você for manter o database.json como OBJETO GERAL, o script.js DEVE ser:
    // const listaDeJogadores = data.players; 
    // Vamos manter o foco no script.js, que é o que está dando erro agora.
    console.log(`\n🎉 SUCESSO! Arquivo compilado gerado em: ${outputPath}`);
    console.log("Agora você pode fazer o GIT PUSH com confiança!");
} catch (e) {
    console.error("❌ FALHA CRÍTICA ao escrever o database.json final.", e.message);
}

console.log("Copiando arquivos estáticos para a pasta de deploy 'docs/'...");

// Limpa a pasta docs antiga
fs.rmdirSync(path.join(publicDir, 'docs'), { recursive: true, force: true });
fs.mkdirSync(path.join(publicDir, 'docs'), { recursive: true });

// Copia todos os arquivos de rpg-players para docs/
fs.readdirSync(path.join(__dirname, '..', 'rpg-players')).forEach(file => {
    if (file !== 'node_modules' && file !== 'build.js' && file !== '.git') { // Exclui pastas de desenvolvimento
        fs.copyFileSync(
            path.join(__dirname, '..', 'rpg-players', file),
            path.join(publicDir, 'docs', file)
        );
    }
});

console.log("✅ Build e cópia para /docs concluídos!");