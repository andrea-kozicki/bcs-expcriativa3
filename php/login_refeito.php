<?php
session_start();
require_once 'config.php';
require_once '../vendor/autoload.php';

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

header('Content-Type: application/json');

// Função de resposta padrão
function resposta($dados) {
  echo json_encode($dados);
  exit;
}

// Se o Content-Type for JSON, tenta descriptografar
$contentType = $_SERVER["CONTENT_TYPE"] ?? '';
if (str_contains($contentType, 'application/json')) {
  require_once __DIR__ . '/cripto_hibrida.php';
  $entrada = descriptografarEntrada();
  $acao = $entrada['acao'] ?? '';
} else {
  $acao = $_POST['acao'] ?? '';
}

// LOGIN PADRÃO (criptografado via front-end)
if ($acao === 'login') {
  $email = $entrada['email'] ?? '';
  $senha = $entrada['senha'] ?? '';

  if (!$email || !$senha) {
    resposta(['success' => false, 'message' => 'Email e senha são obrigatórios.']);
  }

  $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
  $stmt->execute([$email]);
  $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$usuario || !password_verify($senha, $usuario['senha_modern_hash'])) {
    resposta(['success' => false, 'message' => 'Credenciais inválidas.']);
  }

  // Se MFA estiver habilitado
  if ($usuario['mfa_enabled']) {
    $_SESSION['mfa_pending'] = [
      'usuario_id' => $usuario['id'],
      'email' => $usuario['email']
    ];

    $qrSvg = null;
    if ((int)$usuario['mfa_qr_exibido'] === 0) {
      $google2fa = new Google2FA();
      $secret = $usuario['mfa_secret'];
      $issuer = 'MinhaAplicacao';
      $qrData = $google2fa->getQRCodeUrl($issuer, $usuario['email'], $secret);

      $renderer = new ImageRenderer(
        new RendererStyle(200),
        new SvgImageBackEnd()
      );
      $writer = new Writer($renderer);
      $qrSvg = $writer->writeString($qrData);
    }

    resposta([
      'success' => true,
      'mfa_required' => true,
      'qr_svg' => $qrSvg
    ]);
  }

  // Login direto (sem MFA)
  $_SESSION['usuario_id'] = $usuario['id'];
  $_SESSION['usuario_email'] = $usuario['email'];

  resposta([
    'success' => true,
    'usuario_id' => $usuario['id'],
    'usuario_email' => $usuario['email'],
    'redirect' => '/perfil.html'
  ]);
}

// MFA CONTINUA USANDO $_POST
if ($acao === 'verificar_mfa') {
  $email = $_POST['email'] ?? '';
  $senha = $_POST['senha'] ?? '';
  $codigo = $_POST['mfa_code'] ?? '';

  if (!$email || !$senha || !$codigo) {
    resposta(['success' => false, 'message' => 'Todos os campos são obrigatórios.']);
  }

  $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
  $stmt->execute([$email]);
  $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$usuario || !password_verify($senha, $usuario['senha_modern_hash'])) {
    resposta(['success' => false, 'message' => 'Credenciais inválidas.']);
  }

  if (!$usuario['mfa_enabled'] || !$usuario['mfa_secret']) {
    resposta(['success' => false, 'message' => 'MFA não configurado.']);
  }

  $google2fa = new Google2FA();

  if (!$google2fa->verifyKey($usuario['mfa_secret'], $codigo)) {
    resposta(['success' => false, 'message' => 'Código MFA inválido.']);
  }

  if ((int)$usuario['mfa_qr_exibido'] === 0) {
    $stmt = $pdo->prepare("UPDATE usuarios SET mfa_qr_exibido = 1 WHERE id = ?");
    $stmt->execute([$usuario['id']]);
  }

  $_SESSION['usuario_id'] = $usuario['id'];
  $_SESSION['usuario_email'] = $usuario['email'];
  unset($_SESSION['mfa_pending']);

  resposta([
    'success' => true,
    'usuario_id' => $usuario['id'],
    'usuario_email' => $usuario['email'],
    'redirect' => '/perfil.html'
  ]);
}

resposta(['success' => false, 'message' => 'Ação inválida.']);
