<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Sonata\GoogleAuthenticator\GoogleAuthenticator;
use Sonata\GoogleAuthenticator\GoogleQrUrl;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $senha = $_POST['senha'] ?? '';

    if (!$email || strlen($senha) < 12) {
        die("Email inválido ou senha muito curta (mínimo 12 caracteres)");
    }

    $pdo = getDatabaseConnection();
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    $g = new GoogleAuthenticator();
    $secret = $g->generateSecret();

    $qrUrl = GoogleQrUrl::generate($email, $secret, 'LivrariaBSC');
    $qrCodeImagePath = __DIR__ . "/../imagens/qr_$email.png";

    // Salvar imagem do QR code localmente
    $content = file_get_contents($qrUrl);
    if (!$content) {
        die("Erro ao obter o QR Code. Verifique a URL: $qrUrl");
    }
    file_put_contents($qrCodeImagePath, $content);

    try {
        $stmt = $pdo->prepare("INSERT INTO usuarios (email, senha_hash, mfa_enabled, mfa_secret) VALUES (?, ?, 1, ?)");
        $stmt->execute([$email, $senhaHash, $secret]);

        echo "<h2>Usuário cadastrado com sucesso!</h2>";
        echo "<p>Escaneie este QR code no app autenticador:</p>";
        echo "<img src='../imagens/qr_" . urlencode($email) . ".png' alt='QR Code MFA'>";
        echo "<p><strong>Secret:</strong> $secret</p>";

    } catch (PDOException $e) {
        echo "Erro ao cadastrar: " . $e->getMessage();
    }

} else {
    echo '
        <h2>Cadastrar novo usuário com MFA</h2>
        <form method="post">
            <label>Email:</label><br>
            <input type="email" name="email" required><br><br>
            <label>Senha (mín. 12 caracteres):</label><br>
            <input type="password" name="senha" minlength="12" required><br><br>
            <button type="submit">Cadastrar</button>
        </form>
    ';
}
