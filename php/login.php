<?php
session_start();
require_once '../vendor/autoload.php';

header("Content-Type: application/json");

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\ImagickImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

$google2fa = new Google2FA();

// Senha que você deseja hashear (substitua pela senha desejada)
$senha = "SenhaSegura123"; // Exemplo de senha de 12 caracteres

// Gera o hash usando bcrypt (algoritmo recomendado)
$hash = password_hash($senha, PASSWORD_BCRYPT);

// Exibe o hash para você copiar
echo "Hash para inserir no banco de dados: " . $hash;

// Configuração do banco de dados (substitua com suas credenciais)
$pdo = new PDO('mysql:host=localhost;port=3600;dbname=testelogin', 'usuario', 'senha');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Gerar e verificar CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Endpoint para login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    // Verificar CSRF
    if (!isset($_SERVER['HTTP_X_CSRF_TOKEN']) || $_SERVER['HTTP_X_CSRF_TOKEN'] !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Token CSRF inválido']);
        exit;
    }

    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $senha = $_POST['senha'] ?? '';
    
    // Validar entrada
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Email inválido']);
        exit;
    }

    // Buscar usuário no banco de dados
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($senha, $user['senha_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Credenciais inválidas']);
        exit;
    }
    
    // Verificar se MFA está ativado
    if (!$user['mfa_enabled']) {
        echo json_encode([
            'success' => true,
            'mfa_required' => false,
            'token' => generateAuthToken($user['id'])
        ]);
        exit;
    }
    
    // Criar token temporário para MFA
    $mfa_token = bin2hex(random_bytes(16));
    $_SESSION['mfa_tokens'][$mfa_token] = [
        'user_id' => $user['id'],
        'expires' => time() + 300 // 5 minutos de validade
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

// Adicione esta função para criar a tabela de usuários (executar uma vez)
function createUsersTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,
        mfa_secret VARCHAR(255),
        mfa_enabled BOOLEAN DEFAULT FALSE,
        backup_codes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
}

// Endpoint para verificar status MFA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'check_mfa_status') {
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    
    $stmt = $pdo->prepare("SELECT mfa_enabled FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode(['success' => true, 'mfa_enabled' => (bool)$user['mfa_enabled']]);
    } else {
        echo json_encode(['success' => false]);
    }
    exit;
}

// Verificar status do MFA
if (isset($_GET['action']) && $_GET['action'] === 'check_status') {
    $stmt = $pdo->prepare("SELECT mfa_enabled FROM usuarios WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    
    echo json_encode(['mfa_enabled' => (bool)$user['mfa_enabled']]);
    exit;
}

// Alternar status do MFA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['action'] === 'toggle_mfa') {
    $enable = (bool)$_POST['enable'];
    
    if ($enable) {
        // Ativar MFA - gerar novo segredo
        $secret = $google2fa->generateSecretKey();
        
        // Gerar QR Code
        $qrCodeUrl = $google2fa->getQRCodeUrl(
            'Nome da Sua Aplicação',
            $_SESSION['user_email'],
            $secret
        );
        
        // Atualizar banco de dados
        $stmt = $pdo->prepare("UPDATE usuarios SET mfa_secret = ?, mfa_enabled = 1 WHERE id = ?");
        $stmt->execute([$secret, $_SESSION['user_id']]);
        
        echo json_encode([
            'success' => true,
            'secret' => $secret,
            'qr_code' => $qrCodeUrl
        ]);
    } else {
        // Desativar MFA
        $stmt = $pdo->prepare("UPDATE usuarios SET mfa_secret = NULL, mfa_enabled = 0 WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        
        echo json_encode(['success' => true]);
    }
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Ação inválida']);

// No login.php
if ($_SESSION['login_attempts'] > 5) {
    sleep(2); // Atraso para prevenir brute force
}

?>