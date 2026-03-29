const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbodyA1DMWsIpS69eAeXIuAkV1ZD2z2ip9XEwE5/QpoYXjwmiLWiidCoBu3ApKwBz5WtikkPzLQhM2THUAJ0IIwx1Fm+u4Jm8cOWeAjup7NB+7hdFQGg6wR3lNnb9VYV5m8iOhAtbCklmiPgqSN1HDwsq42Vn+73gLdazXx2pZsQIDAQAB
-----END PUBLIC KEY-----`;

const decryptor = new JSEncrypt();
const PUBLIC_KEY_CLEAN = PUBLIC_KEY.replace(/(\r\n|\n|\r|\s)/gm, "");
decryptor.setPublicKey(PUBLIC_KEY_CLEAN);

function onScanSuccess(decodedText) {
    console.log("Texto Bruto Lido do QR Code:", decodedText); 
    html5QrcodeScanner.clear();

    // --- TENTATIVA DE VERIFICAÇÃO DE ASSINATURA ---
    // A chave pública é usada para VERIFICAR a assinatura (de quem usou a chave privada)
    
    // LIMPEZA DA CHAVE PÚBLICA (Vamos fazer de novo, pq é o erro mais comum)
    //const PUBLIC_KEY_CLEAN = PUBLIC_KEY.replace(/(\r\n|\n|\r|\s)/gm, "");
    //decryptor.setPublicKey(PUBLIC_KEY_CLEAN);

    // O JSEncrypt usa o 'verify' para checar assinaturas
    // O formato é: verify(data, signature, hashFunction, encoding)
    // Se você assinou o ID do jogador, você precisa saber o ID original para verificar!
    
    // *** COMO ESTAMOS CONFUNDINDO ASSINATURA COM DECRYPT, VAMOS NO CAMINHO MAIS SIMPLES: ***
    // Vamos assumir que a sua chave gerou uma cifra que o .decrypt DEVERIA ler.
    // Se o seu QR Code é baseado em Texto Puro (ID simples), DESATIVE a criptografia no teste:
    
    // *** TESTE: Se o QR for texto puro (ID simples), use isso: ***
    //const playerID = decodedText; // Ignora o decryptor por um segundo

    // *** TESTE: Se a criptografia RSA for realmente necessária: ***
    const playerID = decryptor.decrypt(decodedText); // DEIXE ESSA LINHA DE VOLTA SE VOCÊ ESTIVER USANDO CRIPTOGRAFIA RSA

    if (!playerID || playerID === "false") {
        alert("QR Inválido ou Chave Incorreta, seu imbecil!"); // <-- Esse é o erro do celular
        location.reload();
        return;
    }

    // 2. Busca os dados no seu JSON estático
    fetch('database.json')
        .then(res => res.json())
        .then(data => {
            // CORREÇÃO CRUCIAL: Acessando o array 'players' DENTRO do objeto 'data'
            const listaDeJogadores = data.players; 
            
            if (!Array.isArray(listaDeJogadores)) {
                alert("Erro: Estrutura do database.json está errada (não é um array em data.players).");
                location.reload();
                return;
            }
            
            const player = listaDeJogadores.find(p => p.id === playerID); // ESSA LINHA AGORA FUNCIONA!
            
            if (player) {
                mostrarPerfil(player);
            } else {
                alert("Jogador não encontrado no banco de dados.");
            }
        });
}

function mostrarPerfil(p) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('perfil-jogador').style.display = 'block';
    
    document.getElementById('p-nome').textContent = p.nome;
    document.getElementById('p-nome').style.color = p.personalizacao.cor_nome;
    document.getElementById('p-titulo').textContent = p.personalizacao.titulo;
    document.getElementById('p-nivel').textContent = p.nivel;
    document.getElementById('p-elo').textContent = p.elo;
}

const html5QrcodeScanner = new Html5QrcodeScanner(
  "reader", 
  {
    fps: 10,
    qrbox: 250,
  },
  /* verbose= */ false
);

// Renderiza o scanner (ele deve mostrar as opções de câmera e upload)
html5QrcodeScanner.render(onScanSuccess);