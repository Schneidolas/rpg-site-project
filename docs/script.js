// docs/script.js - VERSÃO FINAL E LIMPA! (Luna, 2024)

// --- FUNÇÃO DE LOGIN VIA QR CODE ---
function onScanSuccess(decodedText) {
    console.log("Texto Base64 Lido do QR Code:", decodedText);
    
    // Esconde o scanner pra não ficar lendo à toa
    const scannerElement = document.getElementById('reader');
    if (scannerElement) {
        scannerElement.style.display = 'none';
    }

    let playerID;
    try {
        // Tenta decodificar o Base64. atob() é a função nativa do navegador pra isso.
        playerID = atob(decodedText);
    } catch (e) {
        // Se der erro, é porque o QR não continha um Base64 válido.
        console.error("Erro ao decodificar Base64:", e);
        alert("Esse QR Code tá zuado, não é Base64, seu animal!");
        location.reload();
        return;
    }

    console.log("ID Decodificado:", playerID);

    // Agora busca o jogador no nosso banco de dados estático
    fetch('database.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Deu merda no fetch: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || !Array.isArray(data.players)) {
                throw new Error("Estrutura do database.json tá uma bosta, cadê o array de players?");
            }

            const listaDeJogadores = data.players;
            const player = listaDeJogadores.find(p => p.id === playerID);
            
            if (player) {
                mostrarPerfil(player);
            } else {
                alert(`Jogador com ID "${playerID}" não encontrado. Tem certeza que não é um impostor?`);
                location.reload();
            }
        })
        .catch(error => {
            console.error("Erro fatal ao carregar o database:", error);
            alert("Não consegui ler o banco de dados. Vê se o build.js rodou direito, porra!");
            location.reload();
        });
}

// --- FUNÇÃO PARA MOSTRAR O PERFIL NA TELA ---
function mostrarPerfil(p) {
    // Esconde a tela de login
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.style.display = 'none';

    // Mostra a tela de perfil
    const perfilDiv = document.getElementById('perfil-jogador');
    if (perfilDiv) perfilDiv.style.display = 'block';

    // Preenche os dados
    // Adicionando checagens pra não quebrar se o elemento não existir
    const elNome = document.getElementById('p-nome');
    if (elNome) {
        elNome.textContent = p.nome;
        // Aplica a cor personalizada, se existir
        if (p.personalizacao && p.personalizacao.cor_nome) {
            elNome.style.color = p.personalizacao.cor_nome;
        }
    }
    
    const elTitulo = document.getElementById('p-titulo');
    if (elTitulo && p.personalizacao) elTitulo.textContent = p.personalizacao.titulo || '';

    const elNivel = document.getElementById('p-nivel');
    if (elNivel) elNivel.textContent = p.nivel || 1;

    const elElo = document.getElementById('p-elo');
    if (elElo) elElo.textContent = p.elo || 1000;
}


// --- INICIALIZAÇÃO DO SCANNER DE QR CODE ---
// Garante que o script só rode depois que a página carregou toda
document.addEventListener('DOMContentLoaded', () => {
    // Usando uma biblioteca que comprovadamente funciona pra câmera E upload
    const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 } // Configuração mais robusta
        },
        /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, (error) => {
        // Ignora erros comuns de "código não encontrado" pra não poluir o console
        // console.warn(`Erro de scan (ignorável): ${error}`);
    });
});