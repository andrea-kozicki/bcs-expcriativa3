<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Writer;

header('Content-Type: application/json');

// Função auxiliar
function json_erro($mensagem, $codigo = 400)
{
    http_response_code($codigo);
    echo json_encode(["success" => false, "message" => $mensagem]);
    exit;
}

// Captura POST
$email     = $_POST['email']     ?? '';
$senha     = $_POST['senha']     ?? '';
$mfa_code  = $_POST['mfa_code']  ?? null;
$acao      = $_POST['acao']      ?? '';

// Validações básicas
if (strtolower($acao) !== "login") {
    json_erro("Ação inválida.");
}

if (empty($email) || empty($senha)) {
    json_erro("Email e senha são obrigatórios.");
}

// Busca usuário
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario || !$usuario['ativado']) {
    json_erro("Usuário não encontrado ou não ativado.");
}

// Verifica senha com hash + salt
$senha_hash = hash('sha256', $senha . $usuario['salt']);
if (!hash_equals($usuario['senha_hash'], $senha_hash)) {
    json_erro("Email ou senha inválidos.");
}

// MFA habilitado?
if ($usuario['mfa_enabled']) {
    if (empty($mfa_code)) {
        $google2fa = new Google2FA();
        $secret = $usuario['mfa_secret'];

        // 1. Cria otpauth://
        $otpauth = "otpauth://totp/Livraria:{$email}?secret={$secret}&issuer=Livraria";

        // 2. Gera SVG com BaconQrCode
        $renderer = new \BaconQrCode\Renderer\ImageRenderer(
            new \BaconQrCode\Renderer\RendererStyle\RendererStyle(200),
            new \BaconQrCode\Renderer\Image\SvgImageBackEnd()
        );
        $writer = new \BaconQrCode\Writer($renderer);
        $qrSvg = $writer->writeString($otpauth);

        // 3. Retorna SVG diretamente para o JS
        echo json_encode([
            "success" => true,
            "mfa_required" => true,
            "qr_svg" => $qrSvg,
            "message" => "MFA necessário. Escaneie o QR code abaixo se ainda não configurou seu autenticador."
        ]);
        exit;
    }

    // Verifica código MFA
    $google2fa = new Google2FA();
    if (!$google2fa->verifyKey($usuario['mfa_secret'], $mfa_code)) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Código MFA inválido."
        ]);
        exit;
    }
}



// Se passou tudo, cria sessão
session_start();
$_SESSION['usuario_id'] = $usuario['id'];
$_SESSION['usuario_email'] = $usuario['email'];

echo json_encode([
    "success" => true,
    "mfa_required" => false,
    "redirect" => "/perfil.html"
]);
exit;
