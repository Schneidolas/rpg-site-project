// docs/script.js

function onScanSuccess(decodedText) {
    buscarJogador(atob(decodedText));
}

function loginManual() {
    const inputId = document.getElementById('input-manual-id').value.trim();
    if (inputId) buscarJogador(inputId);
}

function buscarJogador(playerID) {
    fetch('database.json')
        .then(res => res.ok ? res.json() : Promise.reject('Falha ao carregar banco de dados'))
        .then(data => {
            const player = (data.players || []).find(p => p.id === playerID);
            if (player) {
                mostrarPerfil(player, data);
            } else {
                alert(`Jogador com ID "${playerID}" não encontrado.`);
            }
        }).catch(err => {
            console.error(err);
            alert("Erro: " + err);
        });
}

function mostrarPerfil(p, db) {
    // Esconde login, mostra dashboard
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('perfil-jogador').style.display = 'grid';

    // --- POPULANDO A BARRA LATERAL ---
    document.getElementById('p-nome').textContent = p.nome;
    document.getElementById('p-titulo').textContent = (p.personalizacao && p.personalizacao.titulo) || 'Aventureiro';
    if(p.personalizacao && p.personalizacao.avatar_url) { // Campo novo
        document.getElementById('p-avatar').src = p.personalizacao.avatar_url;
    }

    document.getElementById('p-moedas').textContent = p.moedas || 0;
    document.getElementById('p-tickets').textContent = p.tickets || 0;
    document.getElementById('p-elo').textContent = p.elo || 1000;

    const nivel = p.nivel || 1;
    const xp = p.xp || 0;
    const xpNecessario = Math.floor(Math.pow(nivel, 1.5) * 500);
    const porcentagemXp = Math.min(100, (xp / xpNecessario) * 100);

    document.getElementById('p-nivel').textContent = nivel;
    document.getElementById('p-xp-texto').textContent = `${xp} / ${xpNecessario} XP`;
    document.getElementById('p-xp-bar').style.width = `${porcentagemXp}%`;

    // --- POPULANDO O CONTEÚDO PRINCIPAL ---
    
    // Insígnias
    const insigniasContainer = document.getElementById('lista-insignias');
    insigniasContainer.innerHTML = '';
    if (p.insignias && p.insignias.length > 0) {
        p.insignias.forEach(id => {
            const insigniaDB = (db.insignias || []).find(i => i.id === id);
            if (insigniaDB) {
                insigniasContainer.innerHTML += `
                    <div class="icon-item" title="${insigniaDB.nome}">
                        <img src="${insigniaDB.imagem}" alt="${insigniaDB.nome}">
                        <span>${insigniaDB.nome}</span>
                    </div>
                `;
            }
        });
    } else {
        insigniasContainer.innerHTML = '<p style="color:var(--text-secondary);">Nenhuma insígnia.</p>';
    }

    // Conquistas
    const conquistasContainer = document.getElementById('lista-conquistas');
    conquistasContainer.innerHTML = '';
    if (p.conquistas && Object.keys(p.conquistas).length > 0) {
        for (const [id, dados] of Object.entries(p.conquistas)) {
            const conqDB = (db.conquistas || []).find(c => c.id === id);
            if (conqDB) {
                const status = dados.desbloqueada ? 'Desbloqueada' : `Progresso: ${dados.progresso_atual || 0}`;
                conquistasContainer.innerHTML += `<div class="list-item"><strong>${conqDB.nome}</strong><span>- ${status}</span></div>`;
            }
        }
    } else {
        conquistasContainer.innerHTML = '<p style="color:var(--text-secondary);">Nenhuma conquista.</p>';
    }

    // Inventário (TCG + Colecionáveis)
    const inventarioContainer = document.getElementById('lista-inventario');
    inventarioContainer.innerHTML = '';
    let hasItems = false;
    // Cartas TCG
    if (p.inventario_tcg) {
        hasItems = true;
        for (const [id, qtd] of Object.entries(p.inventario_tcg)) {
            const cartaDB = (db.cartas || []).find(c => c.id === id);
            if(cartaDB) inventarioContainer.innerHTML += `<div class="list-item">🃏 ${cartaDB.nome} (x${qtd})</div>`;
        }
    }
    // Fragmentos
    if (p.fragmentos_colecionaveis) {
        hasItems = true;
        for (const [id, qtd] of Object.entries(p.fragmentos_colecionaveis)) {
            const colDB = (db.colecionaveis || []).find(c => c.id === id);
            if(colDB) inventarioContainer.innerHTML += `<div class="list-item">🧩 ${colDB.nome} (${qtd}/${colDB.fragmentos_necessarios} Fragmentos)</div>`;
        }
    }
    if (!hasItems) {
        inventarioContainer.innerHTML = '<p style="color:var(--text-secondary);">Mochila vazia.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    html5QrcodeScanner.render(onScanSuccess);
});