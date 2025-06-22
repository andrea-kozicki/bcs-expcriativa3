<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cripto_hibrida.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Writer;

header('Content-Type: application/json');

try {
    $dados = descriptografarEntrada();
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Erro ao descriptografar os dados."]);
    exit;
}

$email = trim($dados['email'] ?? '');
$senha = $dados['senha'] ?? '';

if (!$email || !$senha) {
    echo json_encode(["success" => false, "message" => "E-mail e senha são obrigatórios."]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario) {
    echo json_encode(["success" => false, "message" => "Usuário não encontrado."]);
    exit;
}

if ((int)$usuario['ativado'] !== 1) {
    echo json_encode(["success" => false, "message" => "Conta ainda não ativada."]);
    exit;
}

if (!password_verify($senha, $usuario['senha_modern_hash'])) {
    echo json_encode(["success" => false, "message" => "Senha incorreta."]);
    exit;
}

session_start();
$_SESSION['usuario_id'] = $usuario['id'];
$_SESSION['email'] = $usuario['email'];

$response = [
    "success" => true,
    "usuario_id" => $usuario['id'],
    "usuario_email" => $usuario['email'],
];

// 🔐 MFA
if ((int)$usuario['mfa_enabled'] === 1) {
    $google2fa = new Google2FA();

    if (empty($usuario['mfa_secret'])) {
        // Novo MFA
        $secret = $google2fa->generateSecretKey();
        $issuer = $_ENV['APP_NAME'] ?? 'MinhaAplicacao';
        $qrData = "otpauth://totp/{$issuer}:{$usuario['email']}?secret={$secret}&issuer={$issuer}";

        $renderer = new ImageRenderer(new RendererStyle(200), new SvgImageBackEnd());
        $writer = new Writer($renderer);
        $qrSvg = $writer->writeString($qrData);

        $stmt = $pdo->prepare("UPDATE usuarios SET mfa_secret = ?, mfa_qr_exibido = 0 WHERE id = ?");
        $stmt->execute([$secret, $usuario['id']]);
        $_SESSION['mfa_secret'] = $secret;

        error_log("📤 Novo QR code enviado (sem MFA anterior) para {$usuario['email']}");
        $response['mfa_required'] = true;
        $response['qr_svg'] = $qrSvg;
        echo json_encode($response);
        exit;
    }

    if ((int)$usuario['mfa_qr_exibido'] !== 1) {
        // Reexibir QR
        $issuer = $_ENV['APP_NAME'] ?? 'MinhaAplicacao';
        $qrData = "otpauth://totp/{$issuer}:{$usuario['email']}?secret={$usuario['mfa_secret']}&issuer={$issuer}";

        $renderer = new ImageRenderer(new RendererStyle(200), new SvgImageBackEnd());
        $writer = new Writer($renderer);
        $qrSvg = $writer->writeString($qrData);

        $_SESSION['mfa_secret'] = $usuario['mfa_secret'];
        error_log("📤 Reenviando QR code para {$usuario['email']} (qr_exibido = 0)");
        $response['mfa_required'] = true;
        $response['qr_svg'] = $qrSvg;
        echo json_encode($response);
        exit;
    }

    // MFA ativo e QR já exibido
    $_SESSION['mfa_secret'] = $usuario['mfa_secret'];
    error_log("🔒 QR code não enviado para {$usuario['email']}, já exibido anteriormente.");
    $response['mfa_required'] = true;
    echo json_encode($response);
    exit;
}

// ✅ Sem MFA
echo json_encode($response);
