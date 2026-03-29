// /rpg-admin/crypto-manager.js

const JSEncrypt = require('jsencrypt');

// --- CHAVES ---
// ATENÇÃO: A CHAVE PRIVADA SÓ DEVE SER USADA NO ADMIN (GERAÇÃO/CRIPTOGRAFIA)
const PRIVATE_KEY_ADMIN = `-----BEGIN RSA PRIVATE KEY-----
MIICXwIBAAKBgQCbodyA1DMWsIpS69eAeXIuAkV1ZD2z2ip9XEwE5/QpoYXjwmiLWiidCoBu3ApKwBz5WtikkPzLQhM2THUAJ0IIwx1Fm+u4Jm8cOWeAjup7NB+7hdFQGg6wR3lNnb9VYV5m8iOhAtbCklmiPgqSN1HDwsq42Vn+73gLdazXx2pZsQIDAQABAoGBAJKHD3s/zqXzKxitMaWlMio9OzYuXaWip1SF/JC17nzvtYZduF5TUV+hzpARnaMJQ35F2Sj/1PJt0HbT/2hYjeL+tnf8psYygJx1UPBDY6KMF714Wq74TB8S4Wi6MvULBhVj6cXdKJ6/yrLR/9cKfK4K3WrDoBXj1QTpwmfCfG7BAkEA+bK5yM0wkIIyld+7gVxf6lhEbqioNRb6CBM0k+PgaP+149A1BHh0P3JWcOEHG6pj2ZRneBHwrlDj9F0NixxkyQJBAJ+PYrVhgY1PF7EkKh50OumMWFevpcDvGfREtpL5zQ9TRJlyQvgya1CPyOm3akOQNHg8TEoD2HOqkE6ztck6yakCQQDiGUsPH3WdNLe3bFqt/UZAveJhTUjaoc6Pp0xRqeMXUIyUF4EaZjPlC5RoK+syyuwVJcM3Pw9v2IFBUU0lLPW5AkEAjEovybZ/h9UgyZk4hyo+mhXRntdK74XK1iCMPlHwYCcgS6JRC5SZEm45gnTHs7vYxlaN5Q3YhGpVEz2i+dj8cQJBAPh9R0AixsIzFE2mMKN3WHQBBjY1aNOubfQnBCQ3GXPQzuZlUi4ijVuj7yFS6aH52qpcOMyjSXdIrpLJpscKdSE=
-----END RSA PRIVATE KEY-----`; 

// A CHAVE PÚBLICA VAI SER INJETADA NO LADO DO CLIENTE (Site Público)
// Mas vamos manter uma versão "limpa" aqui para testes no Admin
const PUBLIC_KEY_CLEAN = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbodyA1DMWsIpS69eAeXIuAkV1ZD2z2ip9XEwE5/QpoYXjwmiLWiidCoBu3ApKwBz5WtikkPzLQhM2THUAJ0IIwx1Fm+u4Jm8cOWeAjup7NB+7hdFQGg6wR3lNnb9VYV5m8iOhAtbCklmiPgqSN1HDwsq42Vn+73gLdazXx2pZsQIDAQAB
-----END PUBLIC KEY-----`.replace(/(\r\n|\n|\r|\s)/gm, ""); // Limpa espaços

// --- FUNÇÕES DE CRIPTOGRAFIA (Admin Side) ---

/**
 * Criptografa um ID usando a Chave Privada do Admin (Para gerar o QR Code)
 * @param {string} text - O ID do jogador (ex: "player_schneider")
 * @returns {string | boolean} - O texto criptografado ou false em caso de falha
 */
function encryptIdForQr(text) {
    const encryptor = new JSEncrypt(); // TEM QUE SER JSEncrypt AQUI TAMBÉM!
    encryptor.setPrivateKey(PRIVATE_KEY_ADMIN);
    return encryptor.encrypt(text);
}

// --- FUNÇÕES DE DESCRIPTOGRAFIA (Para o Site Público) ---

/**
 * Configura o decryptor no LADO DO CLIENTE (Site Público)
 * @param {string} publicKeyPem - A chave pública formatada
 * @returns {JSEncrypt} - O objeto configurado
 */
function setupDecryptorClient(publicKeyPem) {
    const decryptor = new JSEncrypt();
    // Garante que a chave esteja limpa, como tentamos fazer antes
    const cleanKey = publicKeyPem.replace(/(\r\n|\n|\r|\s)/gm, "");
    decryptor.setPublicKey(cleanKey);
    return decryptor;
}

/**
 * Descriptografa o texto lido do QR Code usando a Chave Pública
 * @param {string} encryptedText - O texto lido do QR Code
 * @param {JSEncrypt} decryptorInstance - A instância do decryptor configurada
 * @returns {string | null} - O ID original ou null se falhar
 */
function decryptIdFromQr(encryptedText, decryptorInstance) {
    const decrypted = decryptorInstance.decrypt(encryptedText);
    // JSEncrypt retorna 'false' em string se falhar, ou null/false dependendo da versão
    return (decrypted && decrypted !== 'false') ? decrypted : null;
}

module.exports = {
    encryptIdForQr,
    setupDecryptorClient,
    decryptIdFromQr,
    PUBLIC_KEY_CLEAN // Exporta a chave limpa pro script público usar
};