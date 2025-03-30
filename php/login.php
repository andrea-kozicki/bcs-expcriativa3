<?php
require_once '../vendor/autoload.php';

header("Content-Type: application/json");

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\ImagickImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

$google2fa = new Google2FA();

// Endpoint para gerar segredo e QR Code
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'setup') {
    $email = $_GET['email'] ?? '';
    
    // Gerar novo segredo
    $secret = $google2fa->generateSecretKey();
    
    // Gerar URL para QR Code
    $qrCodeUrl = $google2fa->getQRCodeUrl(
        'Sua Livraria',
        $email,
        $secret
    );
    
    // Gerar imagem QR Code
    $renderer = new ImageRenderer(
        new RendererStyle(300),
        new ImagickImageBackEnd()
    );
    $writer = new Writer($renderer);
    $qrCodeImage = 'data:image/png;base64,' . base64_encode($writer->writeString($qrCodeUrl));
    
    echo json_encode([
        'secret' => $secret,
        'qr_code' => $qrCodeImage
    ]);
    exit;
}

// Endpoint para verificar código MFA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'verify') {
    $secret = $_POST['secret'] ?? '';
    $code = $_POST['code'] ?? '';
    
    $valid = $google2fa->verifyKey($secret, $code);
    
    echo json_encode([
        'valid' => $valid
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Requisição inválida']);

?>