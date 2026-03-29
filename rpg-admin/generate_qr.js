const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
// 重要なのは、その関数には既に秘密鍵が含まれているということです！
const { encryptIdForQr } = require('./crypto-manager'); 

// このQRコードで開くことができるプレイヤーID。
const PLAYER_ID_TO_ENCRYPT = "A"; // 「A」でテスト

const encryptedId = encryptIdForQr(PLAYER_ID_TO_ENCRYPT);

if (!encryptedId) {
    console.error("エラー：暗号化に失敗しました。秘密鍵の形式が正しくないか、テキストが長すぎる可能性があります。");
} else {
    console.log("IDの暗号化に成功しました！QRコードを生成する準備ができました。");
    
    // 2. QRコードを生成する（出力はPNG形式になります）
    const outputDir = path.join(__dirname, '..', 'rpg-players', 'qrcodes');
    const outputPath = path.join(outputDir, `${PLAYER_ID_TO_ENCRYPT}_qr.png`);

    // 出力フォルダが存在することを確認します。
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    QRCode.toFile(outputPath, encryptedId, {
        type: 'png',
        errorCorrectionLevel: 'H', // 長いデータセットに対する高い補正値
        scale: 10,
        margin: 1,
        width: 500
    }, function (err) {
        if (err) {
            console.error("QRコードファイルの生成エラー:", err);
        } else {
            console.log(`QRコードの生成と保存場所： ${outputPath}`);
            console.log("✅ このPNGファイルをあなたの公開ウェブサイトで使用してください！");
        }
    });
}