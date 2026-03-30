const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000; // Nosso admin vai rodar em http://localhost:3000

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Pra entender JSON vindo do front
app.use(express.static('public')); // Pra servir os arquivos da pasta 'public' (index.html, admin.js)

const conquistasPath = path.join(__dirname, 'data', 'conquistas.json');

// Rota para salvar uma nova conquista
app.post('/api/conquistas', (req, res) => {
    const novaConquista = req.body;

    if (!novaConquista || !novaConquista.nome) {
        return res.status(400).json({ message: 'Nome da conquista é obrigatório, seu imbecil.' });
    }

    // Lê o arquivo JSON atual
    fs.readFile(conquistasPath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Deu merda ao ler o arquivo de conquistas.' });
        }

        const conquistas = JSON.parse(data);
        conquistas.push(novaConquista);

        // Escreve de volta no arquivo
        fs.writeFile(conquistasPath, JSON.stringify(conquistas, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Deu merda ao salvar a nova conquista.' });
            }
            console.log(`Conquista "${novaConquista.nome}" salva com sucesso.`);
            res.status(201).json(novaConquista);
        });
    });
});

const insigniasPath = path.join(__dirname, 'data', 'insignias.json');

app.post('/api/insignias', (req, res) => {
    const novaInsignia = req.body;

    if (!novaInsignia || !novaInsignia.nome) {
        return res.status(400).json({ message: 'Sem nome não dá, porra.' });
    }

    fs.readFile(insigniasPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Erro ao ler o arquivo de insígnias.' });

        const insignias = JSON.parse(data || '[]'); // Se tiver vazio, vira array
        insignias.push(novaInsignia);

        fs.writeFile(insigniasPath, JSON.stringify(insignias, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Erro ao salvar a insígnia.' });
            console.log(`Insígnia "${novaInsignia.nome}" salva.`);
            res.status(201).json(novaInsignia);
        });
    });
});

// --- ROTAS PARA LER OS DADOS ---

const playersPath = path.join(__dirname, 'data', 'players.json');

app.get('/api/insignias', (req, res) => {
    fs.readFile(insigniasPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Erro ao ler insígnias' });
        res.json(JSON.parse(data || '[]'));
    });
});

app.get('/api/conquistas', (req, res) => {
    fs.readFile(conquistasPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Erro ao ler conquistas' });
        res.json(JSON.parse(data || '[]'));
    });
});

app.get('/api/players', (req, res) => {
    fs.readFile(playersPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Erro ao ler jogadores' });
        res.json(JSON.parse(data || '[]'));
    });
});

app.post('/api/atribuir', (req, res) => {
    const { tipo, playerId, itemId, progresso } = req.body;

    fs.readFile(playersPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Erro ao ler a porra dos players.' });

        let players = JSON.parse(data || '[]');
        let playerIndex = players.findIndex(p => p.id === playerId);

        if (playerIndex === -1) return res.status(404).json({ message: 'Jogador não encontrado.' });

        let p = players[playerIndex];

        if (tipo === 'insignia') {
            if (!p.insignias) p.insignias = [];
            if (!p.insignias.includes(itemId)) {
                p.insignias.push(itemId);
            } else {
                return res.status(400).json({ message: 'Esse corno já tem essa insígnia!' });
            }
        } 
        else if (tipo === 'conquista') {
            if (!p.conquistas) p.conquistas = {};
            
            // Se ele não tem a conquista ainda, inicializa
            if (!p.conquistas[itemId]) {
                p.conquistas[itemId] = { desbloqueada: false, progresso_atual: 0 };
            }

            // Soma o progresso
            p.conquistas[itemId].progresso_atual += progresso;

            // Lógica basicona: se chegou em 1 (ou mais, dependendo do máximo), desbloqueia
            // No futuro a gente cruza com o arquivo conquistas.json pra ver o progresso_max real, 
            // mas por agora, se for > 0 a gente finge que desbloqueou
            if (p.conquistas[itemId].progresso_atual >= 1) { 
                p.conquistas[itemId].desbloqueada = true;
            }
        }

        // Salva de volta
        fs.writeFile(playersPath, JSON.stringify(players, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Erro ao salvar jogador.' });
            res.json({ message: `Item atribuído ao ${p.nome} com sucesso!` });
        });
    });
});

const cartasPath = path.join(__dirname, 'data', 'cartas.json');

app.get('/api/cartas', (req, res) => {
    fs.readFile(cartasPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Erro ao ler cartas' });
        res.json(JSON.parse(data || '[]'));
    });
});

app.post('/api/cartas', (req, res) => {
    const novaCarta = req.body;
    if (!novaCarta || !novaCarta.nome) return res.status(400).json({ message: 'Carta sem nome é papel em branco, porra.' });

    fs.readFile(cartasPath, 'utf8', (err, data) => {
        const cartas = JSON.parse(data || '[]');
        cartas.push(novaCarta);
        fs.writeFile(cartasPath, JSON.stringify(cartas, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Erro ao salvar a carta.' });
            res.status(201).json(novaCarta);
        });
    });
});

app.put('/api/player/:id', (req, res) => {
    const playerId = req.params.id;
    const dadosAtualizados = req.body;

    fs.readFile(playersPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Erro ao ler players.' });
        
        let players = JSON.parse(data || '[]');
        const playerIndex = players.findIndex(p => p.id === playerId);

        if (playerIndex === -1) return res.status(404).json({ message: 'Jogador não encontrado, seu animal.' });

        // Mistura os dados antigos com os novos, pra não perder nada
        players[playerIndex] = { ...players[playerIndex], ...dadosAtualizados };
        // Garante que o objeto de personalização seja mesclado e não substituído
        players[playerIndex].personalizacao = { ...players[playerIndex].personalizacao, ...dadosAtualizados.personalizacao };

        fs.writeFile(playersPath, JSON.stringify(players, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Erro ao salvar a alma do jogador.' });
            res.json({ message: `Alma de ${players[playerIndex].nome} foi corrompida com sucesso!` });
        });
    });
});

app.post('/api/player/:id/inventario', (req, res) => {
    const playerId = req.params.id;
    const { tipo, itemId } = req.body;

    fs.readFile(playersPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Erro ao ler players.' });

        let players = JSON.parse(data || '[]');
        const playerIndex = players.findIndex(p => p.id === playerId);

        if (playerIndex === -1) return res.status(404).json({ message: 'Jogador não encontrado.' });
        
        const p = players[playerIndex];
        let mensagemSucesso = "";

        if (tipo === 'carta') {
            if (!p.inventario_tcg) p.inventario_tcg = {};
            p.inventario_tcg[itemId] = (p.inventario_tcg[itemId] || 0) + 1;
            mensagemSucesso = `+1 Carta adicionada ao inventário de ${p.nome}.`;
        } 
        else if (tipo === 'fragmento') {
            if (!p.fragmentos_colecionaveis) p.fragmentos_colecionaveis = {};
            p.fragmentos_colecionaveis[itemId] = (p.fragmentos_colecionaveis[itemId] || 0) + 1;
            mensagemSucesso = `+1 Fragmento de '${itemId}' adicionado a ${p.nome}.`;
        } 
        else {
            return res.status(400).json({ message: 'Que porra de tipo de item é esse?' });
        }

        fs.writeFile(playersPath, JSON.stringify(players, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Erro ao salvar o item no inventário.' });
            res.json({ message: mensagemSucesso });
        });
    });
});

const colecionaveisPath = path.join(__dirname, 'data', 'colecionaveis.json');

app.post('/api/colecionaveis', (req, res) => {
    const novoCol = req.body;
    
    fs.readFile(colecionaveisPath, 'utf8', (err, data) => {
        let colecionaveis = [];
        if (!err && data) {
            colecionaveis = JSON.parse(data);
        }

        colecionaveis.push(novoCol);

        fs.writeFile(colecionaveisPath, JSON.stringify(colecionaveis, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Erro ao escrever arquivo.' });
            res.status(201).json(novoCol);
        });
    });
});

app.post('/api/player/:id/ajustar-stats', (req, res) => {
    const playerId = req.params.id;
    const valores = req.body; // ex: { xp: 50, moedas: -100 }

    fs.readFile(playersPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Erro ao ler players.' });

        let players = JSON.parse(data || '[]');
        const playerIndex = players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return res.status(404).json({ message: 'Jogador não encontrado.' });
        
        const p = players[playerIndex];
        p.xp = (p.xp || 0) + (valores.xp || 0);
        p.moedas = (p.moedas || 0) + (valores.moedas || 0);
        p.tickets = (p.tickets || 0) + (valores.tickets || 0);
        p.elo = (p.elo || 0) + (valores.elo || 0);

        fs.writeFile(playersPath, JSON.stringify(players, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Erro ao salvar ajustes.' });
            res.json({ message: `Stats de ${p.nome} ajustados!`, player: p });
        });
    });
});

app.get('/api/colecionaveis', (req, res) => {
    fs.readFile(colecionaveisPath, 'utf8', (err, data) => {
        if (err) {
            // Se o arquivo não existir, retorna um array vazio em vez de erro 500
            return res.json([]);
        }
        res.json(JSON.parse(data || '[]'));
    });
});

// Garante que essas rotas existam no server.js!
app.get('/api/players', (req, res) => {
    fs.readFile(playersPath, 'utf8', (err, data) => {
        res.json(JSON.parse(data || '[]'));
    });
});

app.get('/api/cartas', (req, res) => {
    fs.readFile(cartasPath, 'utf8', (err, data) => {
        res.json(JSON.parse(data || '[]'));
    });
});

app.get('/api/colecionaveis', (req, res) => {
    fs.readFile(colecionaveisPath, 'utf8', (err, data) => {
        res.json(JSON.parse(data || '[]'));
    });
});

app.get('/api/insignias', (req, res) => {
    fs.readFile(insigniasPath, 'utf8', (err, data) => {
        res.json(JSON.parse(data || '[]'));
    });
});

app.get('/api/conquistas', (req, res) => {
    fs.readFile(conquistasPath, 'utf8', (err, data) => {
        res.json(JSON.parse(data || '[]'));
    });
});

app.post('/api/player/:id/conquista', (req, res) => {
    const playerId = req.params.id;
    const { conqId, progresso } = req.body;

    // Precisamos ler os players e as conquistas
    const conquistasPath = path.join(__dirname, 'data', 'conquistas.json');

    fs.readFile(playersPath, 'utf8', (err, playersData) => {
        if (err) return res.status(500).json({ message: 'Erro ao ler players.' });
        fs.readFile(conquistasPath, 'utf8', (err2, conqData) => {
            if (err2) return res.status(500).json({ message: 'Erro ao ler catálogo de conquistas.' });

            let players = JSON.parse(playersData || '[]');
            const todasConquistas = JSON.parse(conqData || '[]');
            
            const playerIndex = players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) return res.status(404).json({ message: 'Jogador não encontrado.' });
            
            const p = players[playerIndex];
            const conqInfo = todasConquistas.find(c => c.id === conqId);
            
            if (!conqInfo) return res.status(404).json({ message: 'Conquista não existe no catálogo!' });

            // Inicializa se o coitado não tiver
            if (!p.conquistas) p.conquistas = {};
            if (!p.conquistas[conqId]) {
                p.conquistas[conqId] = { desbloqueada: false, progresso_atual: 0 };
            }

            // Se já tá desbloqueada, não faz sentido somar
            if (p.conquistas[conqId].desbloqueada && progresso > 0) {
                 return res.status(400).json({ message: 'Esse maluco já tem essa conquista, caralho!' });
            }

            // Matemática do progresso
            p.conquistas[conqId].progresso_atual += progresso;

            // Evita progresso negativo bizarro
            if (p.conquistas[conqId].progresso_atual < 0) p.conquistas[conqId].progresso_atual = 0;

            let mensagem = `Progresso de '${conqInfo.nome}' atualizado para ${p.conquistas[conqId].progresso_atual}.`;

            // Lógica de Desbloqueio
            if (conqInfo.tipos.includes('progresso')) {
                const max = conqInfo.progresso_max || 10; // Fallback pra 10 se esquecer
                if (p.conquistas[conqId].progresso_atual >= max) {
                    p.conquistas[conqId].desbloqueada = true;
                    p.conquistas[conqId].progresso_atual = max; // Trava no máximo
                    mensagem = `🎉 PUTA MERDA! Conquista '${conqInfo.nome}' DESBLOQUEADA!`;
                } else {
                    p.conquistas[conqId].desbloqueada = false; // Caso tu remova progresso e ele perca a platina
                }
            } else {
                // Se for Normal, Secreta, etc... qualquer valor > 0 desbloqueia
                if (p.conquistas[conqId].progresso_atual >= 1) {
                    p.conquistas[conqId].desbloqueada = true;
                    p.conquistas[conqId].progresso_atual = 1;
                    mensagem = `✅ Conquista '${conqInfo.nome}' dada ao otário com sucesso.`;
                } else {
                    p.conquistas[conqId].desbloqueada = false;
                }
            }

            // Salva a alma corrompida
            fs.writeFile(playersPath, JSON.stringify(players, null, 2), (err) => {
                if (err) return res.status(500).json({ message: 'Erro ao salvar o JSON.' });
                res.json({ message: mensagem });
            });
        });
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor Admin rodando na porta ${PORT}. Vai lá em http://localhost:${PORT} no teu navegador, porra!`);
});