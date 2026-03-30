// docs/script.js

function onScanSuccess(decodedText) {
    const scannerElement = document.getElementById('reader');
    if (scannerElement) scannerElement.style.display = 'none';

    let playerID;
    try { playerID = atob(decodedText); } 
    catch (e) {
        alert("Selo inválido (Erro Base64)!");
        location.reload(); return;
    }
    buscarJogador(playerID);
}

function loginManual() {
    const inputId = document.getElementById('input-manual-id').value.trim();
    if (!inputId) return alert("Digite o ID, herege!");
    buscarJogador(inputId);
}

function buscarJogador(playerID) {
    fetch('database.json')
        .then(res => res.json())
        .then(data => {
            const listaDeJogadores = data.players || [];
            const player = listaDeJogadores.find(p => p.id === playerID);
            
            if (player) {
                // Passamos o 'data' inteiro pra poder buscar infos de cartas/insígnias
                mostrarPerfil(player, data);
            } else {
                alert(`Alma não encontrada!`);
                location.reload();
            }
        }).catch(err => alert("Erro ao ler o grimório: " + err));
}

function mostrarPerfil(p, db) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('perfil-jogador').style.display = 'block';

    // Header Básico
    const elNome = document.getElementById('p-nome');
    elNome.textContent = p.nome;
    if (p.personalizacao && p.personalizacao.cor_nome) elNome.style.color = p.personalizacao.cor_nome;
    document.getElementById('p-titulo').textContent = (p.personalizacao && p.personalizacao.titulo) ? p.personalizacao.titulo : "Novato";

    // Stats
    document.getElementById('p-moedas').textContent = p.moedas || 0;
    document.getElementById('p-tickets').textContent = p.tickets || 0;
    document.getElementById('p-elo').textContent = p.elo || 1000;

    // MATEMÁTICA DO XP E NÍVEL
    const nivelAtual = p.nivel || 1;
    const xpAtual = p.xp || 0;
    // Fórmula: (Nível ^ 1.5) * 500
    const xpNecessario = Math.floor(Math.pow(nivelAtual, 1.5) * 500);
    const porcentagem = Math.min(100, (xpAtual / xpNecessario) * 100);

    document.getElementById('p-nivel').textContent = nivelAtual;
    document.getElementById('p-xp-texto').textContent = `${xpAtual} / ${xpNecessario} XP`;
    document.getElementById('p-xp-bar').style.width = `${porcentagem}%`;

    // RENDERIZAR INSÍGNIAS
    const divInsignias = document.getElementById('lista-insignias');
    if (p.insignias && p.insignias.length > 0) {
        divInsignias.innerHTML = ''; // Limpa o "fraco"
        p.insignias.forEach(id => {
            const insigniaDB = (db.insignias || []).find(i => i.id === id);
            if (insigniaDB) {
                // Se o ícone for base64 ou url, joga no src
                divInsignias.innerHTML += `<img src="${insigniaDB.imagem}" title="${insigniaDB.nome}" class="item-icon" alt="${insigniaDB.nome}">`;
            }
        });
    }

    // RENDERIZAR INVENTÁRIO TCG
    const divTcg = document.getElementById('lista-tcg');
    if (p.inventario_tcg && Object.keys(p.inventario_tcg).length > 0) {
        divTcg.innerHTML = '';
        for (const [cartaId, quantidade] of Object.entries(p.inventario_tcg)) {
            const cartaDB = (db.cartas || []).find(c => c.id === cartaId);
            if (cartaDB) {
                divTcg.innerHTML += `<div class="item-card"><img src="${cartaDB.imagem}" class="item-icon"> <b>${cartaDB.nome}</b> (x${quantidade})</div>`;
            }
        }
    }

    // RENDERIZAR COLECIONÁVEIS
    const divCol = document.getElementById('lista-colecionaveis');
    if (p.fragmentos_colecionaveis && Object.keys(p.fragmentos_colecionaveis).length > 0) {
        divCol.innerHTML = '';
        for (const [colId, qtd] of Object.entries(p.fragmentos_colecionaveis)) {
            const colDB = (db.colecionaveis || []).find(c => c.id === colId);
            if (colDB) {
                const max = colDB.fragmentos_necessarios || '???';
                divCol.innerHTML += `<div class="item-card">🧩 <b>${colDB.nome}</b>: ${qtd} / ${max} fragmentos</div>`;
            }
        }
    }

    // RENDERIZAR CONQUISTAS (Simplificado por agora)
    const divConq = document.getElementById('lista-conquistas');
    if (p.conquistas && Object.keys(p.conquistas).length > 0) {
        divConq.innerHTML = '';
        for (const [conqId, dadosConq] of Object.entries(p.conquistas)) {
            const conqDB = (db.conquistas || []).find(c => c.id === conqId);
            if (conqDB) {
                let status = dadosConq.desbloqueada ? "✅ Desbloqueada" : `🔒 Progresso: ${dadosConq.progresso_atual}`;
                divConq.innerHTML += `<div class="item-card">🏆 <b>${conqDB.nome}</b> - ${status}</div>`;
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    html5QrcodeScanner.render(onScanSuccess);
});