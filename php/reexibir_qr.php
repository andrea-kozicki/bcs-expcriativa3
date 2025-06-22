<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/config.php';

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;

session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "message" => "Usuário não autenticado."]);
    exit;
}

$pdo = getDatabaseConnection();
$stmt = $pdo->prepare("SELECT email, mfa_secret FROM usuarios WHERE id = ?");
$stmt->execute([$_SESSION['usuario_id']]);
$usuario = $stmt->fetch();

if (!$usuario || empty($usuario['mfa_secret'])) {
    echo json_encode(["success" => false, "message" => "Usuário ou segredo MFA não encontrado."]);
    exit;
}

$google2fa = new Google2FA();
$qrContent = $google2fa->getQRCodeUrl(
    'BCS Plataforma',
    $usuario['email'],
    $usuario['mfa_secret']
);

$renderer = new ImageRenderer(
    new RendererStyle(200),
    new SvgImageBackEnd()
);
$writer = new Writer($renderer);
$qrSvg = $writer->writeString($qrContent);

echo json_encode(["success" => true, "qr_svg" => $qrSvg]);
