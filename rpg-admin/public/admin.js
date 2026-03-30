// --- CONFIGURAÇÕES GERAIS ---
let todosPlayers = [];

// Função pra evitar que o código quebre se um elemento não existir
const getEl = (id) => document.getElementById(id);

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Luna OS carregada. Iniciando rituais de administração...");
    carregarDadosGerais();
    configurarEventos();
});

// --- CARREGAMENTO DE DADOS ---
async function carregarDadosGerais() {
    const fetchSafe = async (url) => {
        try {
            const res = await fetch(url);
            return res.ok ? await res.json() : [];
        } catch (e) { return []; }
    };

    const [players, cartas, colecionaveis, insignias, conquistas] = await Promise.all([
        fetchSafe('/api/players'),
        fetchSafe('/api/cartas'),
        fetchSafe('/api/colecionaveis'),
        fetchSafe('/api/insignias'),
        fetchSafe('/api/conquistas')
    ]);

    todosPlayers = players;

    // Preencher Selects de Jogadores
    const selectsPlayer = ['select-player-editor', 'select-player-insignia', 'select-player-conquista'];
    selectsPlayer.forEach(id => {
        const el = getEl(id);
        if (el) {
            el.innerHTML = '<option value="">-- Selecione --</option>';
            players.forEach(p => el.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
        }
    });

    // Preencher Select de Cartas
    const selAddCarta = getEl('select-add-carta');
    if (selAddCarta) {
        selAddCarta.innerHTML = '';
        cartas.forEach(c => selAddCarta.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
    }

    // Preencher Select de Fragmentos/Colecionáveis
    const selAddFrag = getEl('select-add-fragmento');
    if (selAddFrag) {
        selAddFrag.innerHTML = '';
        colecionaveis.forEach(col => selAddFrag.innerHTML += `<option value="${col.id}">${col.nome}</option>`);
    }

    // Preencher Select de Insígnias e Conquistas (Atribuição)
    const selIns = getEl('select-insignia');
    if (selIns) {
        selIns.innerHTML = '';
        insignias.forEach(i => selIns.innerHTML += `<option value="${i.id}">${i.nome}</option>`);
    }

    const selConq = getEl('select-conquista');
    if (selConq) {
        selConq.innerHTML = '';
        conquistas.forEach(c => selConq.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
    }
}

// --- CONFIGURAÇÃO DE EVENTOS (BOTÕES) ---
function configurarEventos() {
    // 1. Mostrar Editor de Almas ao selecionar jogador
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
                getEl('edit-cor-nome').value = (player.personalizacao && player.personalizacao.cor_nome) || '#ffffff';
                getEl('edit-titulo').value = (player.personalizacao && player.personalizacao.titulo) || '';

                // --- ADICIONE ESTA PARTE PARA O AVATAR ---
                const avatarBase64 = (player.personalizacao && player.personalizacao.avatar_url) || '';
                getEl('edit-avatar').value = avatarBase64;
                const prevAvatar = getEl('prev-avatar');
                if (avatarBase64) {
                    prevAvatar.src = avatarBase64;
                    prevAvatar.style.display = 'block';
                } else {
                    prevAvatar.style.display = 'none';
                }
                // -----------------------------------------
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
            // Adiciona o avatar_url no objeto de personalizacao
            const dados = {
                nivel: parseInt(getEl('edit-nivel').value),
                xp: parseInt(getEl('edit-xp').value),
                moedas: parseInt(getEl('edit-moedas').value),
                tickets: parseInt(getEl('edit-tickets').value),
                elo: parseInt(getEl('edit-elo').value),
                personalizacao: {
                    cor_nome: getEl('edit-cor-nome').value,
                    titulo: getEl('edit-titulo').value,
                    avatar_url: getEl('edit-avatar').value // <--- LINHA NOVA AQUI
                }
            };
            const res = await fetch(`/api/player/${playerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
            });
            
            // --- CÓDIGO NOVO AQUI ---
            if (res.ok) {
                getEl('status-editor').textContent = "Alma salva com sucesso!";
                getEl('status-editor').style.color = 'lightgreen';
            } else {
                const errData = await res.json();
                getEl('status-editor').textContent = "Erro: " + (errData.message || "Servidor recusou a foto. Muito grande?");
                getEl('status-editor').style.color = 'tomato';
            }
            // -------------------------
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
                // Atualiza campos
                getEl('edit-xp').value = data.player.xp;
                getEl('edit-moedas').value = data.player.moedas;
                getEl('edit-tickets').value = data.player.tickets;
                getEl('edit-elo').value = data.player.elo;
                // Limpa campos de add
                ['add-xp', 'add-moedas', 'add-tickets', 'add-elo'].forEach(id => getEl(id).value = '');
            }
        });
    }

    // 4. Adicionar Carta e Fragmento
    const btnCarta = getEl('btn-add-carta');
    if (btnCarta) {
        btnCarta.addEventListener('click', () => {
            const itemId = getEl('select-add-carta').value;
            adicionarItem('carta', itemId);
        });
    }

    const btnFrag = getEl('btn-add-fragmento');
    if (btnFrag) {
        btnFrag.addEventListener('click', () => {
            const itemId = getEl('select-add-fragmento').value;
            adicionarItem('fragmento', itemId);
        });
    }

    // 5. Criadores (Conquista, Insígnia, Carta, Colecionável)
    configurarFormulario('form-conquista', '/api/conquistas', 'status');
    configurarFormulario('form-insignia', '/api/insignias', 'status-insignia');
    configurarFormulario('form-carta', '/api/cartas', 'status-carta');
    configurarFormulario('form-colecionavel', '/api/colecionaveis', 'status-colecionavel');

    // Lógica específica pra Conquista (checkboxes)
    const chkSecreta = getEl('tipo-secreta');
    if (chkSecreta) {
        chkSecreta.addEventListener('change', () => {
            getEl('campos-secretos').style.display = chkSecreta.checked ? 'block' : 'none';
        });
    }
    const chkProgresso = getEl('tipo-progresso');
    if (chkProgresso) {
        chkProgresso.addEventListener('change', () => {
            getEl('campo-progresso').style.display = chkProgresso.checked ? 'block' : 'none';
        });
    }
}

// --- FUNÇÕES AUXILIARES ---

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
        
        // Coleta automática de dados do form
        const formData = new FormData(form);
        const data = {};
        
        // Lógica manual pra garantir IDs corretos (baseado no que já fizemos)
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
            if (statusEl) statusEl.textContent = "Salvo com sucesso!";
            form.reset();
            carregarDadosGerais(); // Recarrega os menus!
        } else {
            if (statusEl) statusEl.textContent = "Erro ao salvar.";
        }
    });
}

// --- CONVERSOR DE IMAGEM PARA BASE64 (Automático) ---
document.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('file-to-base64')) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const targetId = e.target.getAttribute('data-target');
        const previewId = targetId.replace('imagem', 'prev').replace('edit', 'prev'); // Gambiarra pra achar a img de preview

        reader.onload = function() {
            const base64String = reader.result;
            const targetInput = document.getElementById(targetId);
            if (targetInput) targetInput.value = base64String;
            
            const prevImg = document.getElementById(previewId);
            if(prevImg) { 
                prevImg.src = base64String; 
                prevImg.style.display = 'block'; 
            }
        };
        reader.readAsDataURL(file);
    }
});