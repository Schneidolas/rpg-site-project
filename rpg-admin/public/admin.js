// --- CONFIGURAÇÕES GERAIS ---
let todosPlayers = [];

const getEl = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosGerais();
    configurarEventos();
});

// --- CARREGAMENTO DE DADOS ---
async function carregarDadosGerais() {
    const fetchSafe = async (url) => {
        try { const res = await fetch(url); return res.ok ? await res.json() : []; } 
        catch (e) { return []; }
    };

    const [players, cartas, colecionaveis, insignias, conquistas] = await Promise.all([
        fetchSafe('/api/players'),
        fetchSafe('/api/cartas'),
        fetchSafe('/api/colecionaveis'),
        fetchSafe('/api/insignias'),
        fetchSafe('/api/conquistas')
    ]);

    todosPlayers = players;

    // Preenche Jogadores
    const selEditor = getEl('select-player-editor');
    if (selEditor) {
        selEditor.innerHTML = '<option value="">-- Selecione --</option>';
        players.forEach(p => selEditor.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
    }

    // Preenche Cartas e Fragmentos
    const selAddCarta = getEl('select-add-carta');
    if (selAddCarta) {
        selAddCarta.innerHTML = '';
        cartas.forEach(c => selAddCarta.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
    }

    const selAddFrag = getEl('select-add-fragmento');
    if (selAddFrag) {
        selAddFrag.innerHTML = '';
        colecionaveis.forEach(col => selAddFrag.innerHTML += `<option value="${col.id}">${col.nome}</option>`);
    }

    // Preenche NOVO dropdown de Conquistas
    const selAddConq = getEl('select-add-conquista');
    if (selAddConq) {
        selAddConq.innerHTML = '';
        conquistas.forEach(c => {
            const isProgresso = c.tipos.includes('progresso') ? '(Progresso)' : '(Normal)';
            selAddConq.innerHTML += `<option value="${c.id}">${c.nome} ${isProgresso}</option>`;
        });
    }
}

// --- CONFIGURAÇÃO DE EVENTOS (BOTÕES) ---
function configurarEventos() {
    
    // 1. Mostrar Editor ao selecionar jogador
    const selEditor = getEl('select-player-editor');
    if (selEditor) {
        selEditor.addEventListener('change', () => {
            const player = todosPlayers.find(p => p.id === selEditor.value);
            const container = getEl('editor-container');
            
            if (player && container) {
                getEl('editor-nome-jogador').textContent = `Editando: ${player.nome}`;
                getEl('edit-nivel').value = player.nivel || 1;
                getEl('edit-xp').value = player.xp || 0;
                getEl('edit-moedas').value = player.moedas || 0;
                getEl('edit-tickets').value = player.tickets || 0;
                getEl('edit-elo').value = player.elo || 1000;
                
                const perso = player.personalizacao || {};
                getEl('edit-cor-nome').value = perso.cor_nome || '#ffffff';
                getEl('edit-titulo').value = perso.titulo || '';

                const avatarBase64 = perso.avatar_url || '';
                getEl('edit-avatar').value = avatarBase64;
                const prevAvatar = getEl('prev-avatar');
                if (avatarBase64) {
                    prevAvatar.src = avatarBase64;
                    prevAvatar.style.display = 'block';
                } else {
                    prevAvatar.style.display = 'none';
                }

                // Renderiza Progresso de Conquistas Atual
                atualizarListaConquistasVisual(player);

                container.style.display = 'block';
            } else if (container) {
                container.style.display = 'none';
            }
        });
    }

    // 2. Salvar Tudo (Editor de Almas)
    const btnSalvar = getEl('btn-salvar-tudo');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', async () => {
            const playerId = getEl('select-player-editor').value;
            const dados = {
                nivel: parseInt(getEl('edit-nivel').value),
                xp: parseInt(getEl('edit-xp').value),
                moedas: parseInt(getEl('edit-moedas').value),
                tickets: parseInt(getEl('edit-tickets').value),
                elo: parseInt(getEl('edit-elo').value),
                personalizacao: {
                    cor_nome: getEl('edit-cor-nome').value,
                    titulo: getEl('edit-titulo').value,
                    avatar_url: getEl('edit-avatar').value
                }
            };
            const res = await fetch(`/api/player/${playerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            if (res.ok) {
                getEl('status-editor').textContent = "Alma salva com sucesso!";
                getEl('status-editor').style.color = 'lightgreen';
            } else {
                const errData = await res.json();
                getEl('status-editor').textContent = "Erro: " + (errData.message || "Erro desconhecido.");
                getEl('status-editor').style.color = 'tomato';
            }
        });
    }

    // 3. Aplicar Ajustes Rápidos (+/-)
    const btnAjustes = getEl('btn-aplicar-ajustes');
    if (btnAjustes) {
        btnAjustes.addEventListener('click', async () => {
            const playerId = getEl('select-player-editor').value;
            const ajustes = {
                xp: parseInt(getEl('add-xp').value) || 0,
                moedas: parseInt(getEl('add-moedas').value) || 0,
                tickets: parseInt(getEl('add-tickets').value) || 0,
                elo: parseInt(getEl('add-elo').value) || 0
            };
            const res = await fetch(`/api/player/${playerId}/ajustar-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ajustes)
            });
            if (res.ok) {
                const data = await res.json();
                getEl('edit-xp').value = data.player.xp;
                getEl('edit-moedas').value = data.player.moedas;
                getEl('edit-tickets').value = data.player.tickets;
                getEl('edit-elo').value = data.player.elo;
                ['add-xp', 'add-moedas', 'add-tickets', 'add-elo'].forEach(id => getEl(id).value = '');
            }
        });
    }

    // 4. Adicionar Carta e Fragmento
    const btnCarta = getEl('btn-add-carta');
    if (btnCarta) btnCarta.addEventListener('click', () => adicionarItem('carta', getEl('select-add-carta').value));
    
    const btnFrag = getEl('btn-add-fragmento');
    if (btnFrag) btnFrag.addEventListener('click', () => adicionarItem('fragmento', getEl('select-add-fragmento').value));

    // 5. ATUALIZAR CONQUISTA (O BOTÃO QUE TAVA QUEBRADO)
    const btnConq = getEl('btn-atualizar-conquista');
    if (btnConq) {
        btnConq.addEventListener('click', async () => {
            const playerId = getEl('select-player-editor').value;
            const conqId = getEl('select-add-conquista').value;
            const progresso = parseInt(getEl('input-progresso-conquista').value) || 0;

            if (!playerId || !conqId) return alert("Selecione o jogador e a conquista, seu animal!");

            const res = await fetch(`/api/player/${playerId}/conquista`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conqId, progresso })
            });

            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                // Atualiza a lista visual na hora
                await carregarDadosGerais(); 
                getEl('select-player-editor').dispatchEvent(new Event('change')); 
            } else {
                const err = await res.json();
                alert("Erro: " + err.message);
            }
        });
    }

    // 6. Criadores
    configurarFormulario('form-conquista', '/api/conquistas', 'status');
    configurarFormulario('form-insignia', '/api/insignias', 'status-insignia');
    configurarFormulario('form-carta', '/api/cartas', 'status-carta');
    configurarFormulario('form-colecionavel', '/api/colecionaveis', 'status-colecionavel');

    // Lógica checkboxes Conquista
    const chkSecreta = getEl('tipo-secreta');
    if (chkSecreta) chkSecreta.addEventListener('change', () => getEl('campos-secretos').style.display = chkSecreta.checked ? 'block' : 'none');
    
    const chkProgresso = getEl('tipo-progresso');
    if (chkProgresso) chkProgresso.addEventListener('change', () => getEl('campo-progresso').style.display = chkProgresso.checked ? 'block' : 'none');
}

// --- FUNÇÕES AUXILIARES ---

function atualizarListaConquistasVisual(player) {
    const divConqProg = getEl('lista-conquistas-jogador');
    if (!divConqProg) return;

    divConqProg.innerHTML = '';
    if (player.conquistas && Object.keys(player.conquistas).length > 0) {
        for (const [id, dados] of Object.entries(player.conquistas)) {
            let nomeConq = id;
            try {
                const todasConq = Array.from(getEl('select-add-conquista').options).map(o => ({id: o.value, nome: o.text}));
                const c = todasConq.find(x => x.id === id);
                if (c) nomeConq = c.nome.replace(' (Progresso)', '').replace(' (Normal)', '');
            } catch(e){}

            const status = dados.desbloqueada ? '<span style="color:lightgreen">✅ Desbloqueada</span>' : `<span style="color:orange">⏳ Progresso: ${dados.progresso_atual}</span>`;
            divConqProg.innerHTML += `<div style="padding: 5px; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
                <span>${nomeConq}</span> ${status}
            </div>`;
        }
    } else {
        divConqProg.innerHTML = '<p style="color:#555">Nenhuma conquista iniciada.</p>';
    }
}

async function adicionarItem(tipo, itemId) {
    const playerId = getEl('select-player-editor').value;
    if (!playerId || !itemId) return alert("Selecione tudo!");

    const res = await fetch(`/api/player/${playerId}/inventario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, itemId })
    });
    if (res.ok) alert("+1 adicionado!");
}

function configurarFormulario(formId, url, statusId) {
    const form = getEl(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {};
        
        if (formId === 'form-conquista') {
            data.id = `conq_${Date.now()}`;
            data.nome = getEl('nome').value;
            data.descricao = getEl('descricao').value;
            data.imagem = getEl('imagem').value;
            data.tipos = [];
            if (getEl('tipo-rara').checked) data.tipos.push('rara'); else data.tipos.push('normal');
            if (getEl('tipo-secreta').checked) {
                data.tipos.push('secreta');
                data.nome_real = getEl('nome_real').value;
                data.descricao_real = getEl('descricao_real').value;
            }
            if (getEl('tipo-progresso').checked) {
                data.tipos.push('progresso');
                data.progresso_max = parseInt(getEl('progresso_max').value);
            }
        } else if (formId === 'form-colecionavel') {
            data.id = getEl('id-colecionavel').value;
            data.nome = getEl('nome-colecionavel').value;
            data.fragmentos_necessarios = parseInt(getEl('fragmentos-necessarios').value);
        } else if (formId === 'form-carta') {
            data.id = `card_${Date.now()}`;
            data.nome = getEl('nome-carta').value;
            data.imagem = getEl('imagem-carta').value;
        } else if (formId === 'form-insignia') {
            data.id = `insig_${Date.now()}`;
            data.nome = getEl('nome-insignia').value;
            data.imagem = getEl('imagem-insignia').value;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const statusEl = getEl(statusId);
        if (res.ok) {
            if (statusEl) { statusEl.textContent = "Salvo com sucesso!"; statusEl.style.color = "lightgreen"; }
            form.reset();
            carregarDadosGerais(); 
        } else {
            if (statusEl) { statusEl.textContent = "Erro ao salvar."; statusEl.style.color = "tomato"; }
        }
    });
}

// --- CONVERSOR DE IMAGEM PARA BASE64 ---
document.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('file-to-base64')) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const targetId = e.target.getAttribute('data-target');
        const previewId = targetId.replace('imagem', 'prev').replace('edit', 'prev');

        reader.onload = function() {
            const targetInput = document.getElementById(targetId);
            if (targetInput) targetInput.value = reader.result;
            
            const prevImg = document.getElementById(previewId);
            if(prevImg) { prevImg.src = reader.result; prevImg.style.display = 'block'; }
        };
        reader.readAsDataURL(file);
    }
});