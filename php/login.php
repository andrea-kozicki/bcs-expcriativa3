<?php
require_once '../vendor/autoload.php';

header("Content-Type: application/json");

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\ImagickImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

$google2fa = new Google2FA();

// Simulação de banco de dados
$users = [
    'usuario@exemplo.com' => [
        'senha_hash' => password_hash('senha123', PASSWORD_BCRYPT),
        'mfa_secret' => null,
        'mfa_enabled' => false,
        'backup_codes' => []
    ]
];

// Endpoint para login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $email = $_POST['email'] ?? '';
    $senha = $_POST['senha'] ?? '';
    
    // Verificar usuário
    if (!isset($users[$email])) {
        echo json_encode(['success' => false, 'message' => 'Credenciais inválidas']);
        exit;
    }
    
    $user = $users[$email];
    
    // Verificar senha
    if (!password_verify($senha, $user['senha_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Credenciais inválidas']);
        exit;
    }
    
    // Se MFA não estiver ativado, permitir login
    if (!$user['mfa_enabled']) {
        echo json_encode([
            'success' => true,
            'mfa_required' => false,
            'token' => generateAuthToken($email)
        ]);
        exit;
    }
    
    // Se MFA estiver ativado, requerer código
    $mfa_token = bin2hex(random_bytes(16));
    $_SESSION['mfa_tokens'][$mfa_token] = [
        'email' => $email,
        'expires' => time() + 300 // 5 minutos
    ];
    
    echo json_encode([
        'success' => true,
        'mfa_required' => true,
        'mfa_token' => $mfa_token
    ]);
    exit;
}

// Endpoint para verificar código MFA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'verify_mfa') {
    $mfa_token = $_POST['mfa_token'] ?? '';
    $code = $_POST['code'] ?? '';
    
    if (!isset($_SESSION['mfa_tokens'][$mfa_token]) || $_SESSION['mfa_tokens'][$mfa_token]['expires'] < time()) {
        echo json_encode(['success' => false, 'message' => 'Sessão inválida ou expirada']);
        exit;
    }
    
    $email = $_SESSION['mfa_tokens'][$mfa_token]['email'];
    $user = $users[$email];
    
    $valid = $google2fa->verifyKey($user['mfa_secret'], $code);
    
    if ($valid) {
        unset($_SESSION['mfa_tokens'][$mfa_token]);
        echo json_encode([
            'success' => true,
            'token' => generateAuthToken($email)
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Código inválido']);
    }
    exit;
}

// Endpoint para configurar MFA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'setup_mfa') {
    $email = $_POST['email'] ?? '';
    
    // Gerar novo segredo
    $secret = $google2fa->generateSecretKey();
    
    // Gerar QR Code
    $qrCodeUrl = $google2fa->getQRCodeUrl(
        'Sua Livraria',
        $email,
        $secret
    );
    
    $renderer = new ImageRenderer(
        new RendererStyle(300),
        new ImagickImageBackEnd()
    );
    $writer = new Writer($renderer);
    $qrCodeImage = 'data:image/png;base64,' . base64_encode($writer->writeString($qrCodeUrl));
    
    // Gerar códigos de backup
    $backupCodes = array_map(function() {
        return strtoupper(bin2hex(random_bytes(3))); // Códigos de 6 caracteres
    }, array_fill(0, 8, null));
    
    // Armazenar segredo e códigos temporariamente
    $_SESSION['mfa_setup'] = [
        'email' => $email,
        'secret' => $secret,
        'backup_codes' => $backupCodes,
        'expires' => time() + 900 // 15 minutos
    ];
    
    echo json_encode([
        'success' => true,
        'secret' => $secret,
        'qr_code' => $qrCodeImage,
        'backup_codes' => $backupCodes
    ]);
    exit;
}

// Endpoint para confirmar configuração MFA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'confirm_mfa') {
    $email = $_POST['email'] ?? '';
    $code = $_POST['code'] ?? '';
    
    if (!isset($_SESSION['mfa_setup']) || $_SESSION['mfa_setup']['email'] !== $email || $_SESSION['mfa_setup']['expires'] < time()) {
        echo json_encode(['success' => false, 'message' => 'Sessão de configuração inválida']);
        exit;
    }
    
    $setupData = $_SESSION['mfa_setup'];
    $valid = $google2fa->verifyKey($setupData['secret'], $code);
    
    if ($valid) {
        // Ativar MFA para o usuário (em produção, salve no banco de dados)
        $users[$email]['mfa_secret'] = $setupData['secret'];
        $users[$email]['mfa_enabled'] = true;
        $users[$email]['backup_codes'] = $setupData['backup_codes'];
        
        unset($_SESSION['mfa_setup']);
        
        echo json_encode([
            'success' => true,
            'backup_codes' => $setupData['backup_codes']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Código inválido']);
    }
    exit;
}

function generateAuthToken($email) {
    // Em produção, use JWT ou outro método seguro
    return bin2hex(random_bytes(32));
}

http_response_code(400);
echo json_encode(['error' => 'Requisição inválida']);
?>