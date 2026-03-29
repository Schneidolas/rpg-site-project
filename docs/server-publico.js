const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001; 

// O site público precisa servir os arquivos da pasta 'rpg-players'
app.use(express.static(path.join(__dirname, 'rpg-players')));

app.listen(PORT, () => {
    console.log(`✅ Site Público rodando em http://localhost:${PORT}`);
});