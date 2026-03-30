// docs/script.js

// 1. SCANNER DO QR CODE (Lê Base64)
function onScanSuccess(decodedText) {
    console.log("QR Lido:", decodedText);
    
    // Esconde o scanner
    const scannerElement = document.getElementById('reader');
    if (scannerElement) scannerElement.style.display = 'none';

    let playerID;
    try {
        playerID = atob(decodedText); // Decodifica Base64
    } catch (e) {
        alert("O feitiço falhou! Este selo (QR) não contém uma alma válida.");
        location.reload();
        return;
    }

    console.log("ID Decodificado:", playerID);
    buscarJogador(playerID);
}

// 2. LOGIN MANUAL PELO ID (Fallback)
function loginManual() {
    const inputId = document.getElementById('input-manual-id').value.trim();
    if (!inputId) {
        alert("Digite o Nome Verdadeiro (ID), seu herege!");
        return;
    }
    console.log("Login Manual tentado para:", inputId);
    buscarJogador(inputId);
}

// 3. A BUSCA NO BANCO DE DADOS (Usada por ambos os logins)
function buscarJogador(playerID) {
    fetch('database.json')
        .then(response => {
            if (!response.ok) throw new Error("Grimório inacessível (database.json não encontrado)");
            return response.json();
        })
        .then(data => {
            const listaDeJogadores = data.players;
            if (!Array.isArray(listaDeJogadores)) {
                throw new Error("As páginas do Grimório estão em branco! (data.players não é array)");
            }

            const player = listaDeJogadores.find(p => p.id === playerID);
            
            if (player) {
                mostrarPerfil(player);
            } else {
                alert(`Nenhuma alma atende pelo nome "${playerID}" nestas terras.`);
                location.reload();
            }
        })
        .catch(error => {
            console.error(error);
            alert("Erro nas magias de comunicação: " + error.message);
        });
}

// 4. DESENHA O PERGAMINHO
function mostrarPerfil(p) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('perfil-jogador').style.display = 'block';

    const elNome = document.getElementById('p-nome');
    if (elNome) {
        elNome.textContent = p.nome;
        // Pinta o nome se tiver cor customizada (e garante que não fique invisível no pergaminho)
        if (p.personalizacao && p.personalizacao.cor_nome) {
            elNome.style.color = p.personalizacao.cor_nome;
        }
    }
    
    const elTitulo = document.getElementById('p-titulo');
    if (elTitulo) elTitulo.textContent = (p.personalizacao && p.personalizacao.titulo) ? p.personalizacao.titulo : "Novato da Guilda";

    // Puxa os dados ou coloca 0 se não existirem ainda
    document.getElementById('p-nivel').textContent = p.nivel || 1;
    document.getElementById('p-xp').textContent = p.xp || 0;
    document.getElementById('p-moedas').textContent = p.moedas || 0;
    document.getElementById('p-tickets').textContent = p.tickets || 0;
    document.getElementById('p-elo').textContent = p.elo || 1000;
}

// INICIALIZA O OLHO MÁGICO (Scanner)
document.addEventListener('DOMContentLoaded', () => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
    );
    html5QrcodeScanner.render(onScanSuccess);
});