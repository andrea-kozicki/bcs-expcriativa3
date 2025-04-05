<?php
//Definição de sessão
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'],
    'secure' => isset($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();

// Headers para CORS e JSON
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400"); // cache preflight por 1 dia


// Configurações de erro (desative em produção)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Carrega dependências
require_once __DIR__.'/../vendor/autoload.php';

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\ImagickImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

// Inicializa Google2FA
$google2fa = new Google2FA();

// Conexão com o banco de dados
try {

    $dbHost = getenv('DB_HOST') ?: 'localhost';
    $dbName = getenv('DB_NAME') ?: 'testelogin';
    $dbUser = getenv('DB_USER') ?: 'usuario@exemplo.com';
    $dbPass = getenv('DB_PASS') ?: 'SenhaSegura123';

    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Erro de conexão com o banco']));
}

// Geração de CSRF Token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Rotas da API
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    // Verificação CSRF
    if (empty($input['csrf_token']) || $input['csrf_token'] !== $_SESSION['csrf_token']) {
        http_response_code(403);
        die(json_encode(['success' => false, 'message' => 'Token CSRF inválido']));
    }

    if (empty($input['action'])) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Ação não especificada']));
    }

    try {
        switch ($input['action']) {
            case 'login':
                handleLogin($pdo, $google2fa, $input);
                break;
                
            case 'verify_mfa':
                handleVerifyMfa($pdo, $google2fa, $input);
                break;
                
            case 'setup_mfa':
                handleSetupMfa($pdo, $google2fa, $input);
                break;
                
            case 'confirm_mfa':
                handleConfirmMfa($pdo, $google2fa, $input);
                break;
                
            default:
                http_response_code(400);
                die(json_encode(['success' => false, 'message' => 'Ação desconhecida']));
        }
    } catch (Exception $e) {
        http_response_code(500);
        die(json_encode(['success' => false, 'message' => $e->getMessage()]));
    }
} else {
    http_response_code(405);
    die(json_encode(['error' => 'Method Not Allowed']));
}

//Content-type

if (empty($_SERVER['CONTENT_TYPE']) || stripos($_SERVER['CONTENT_TYPE'], 'application/json') === false) {
    http_response_code(415);
    die(json_encode(['success' => false, 'message' => 'Content-Type deve ser application/json']));
}

// Funções de tratamento
function handleLogin($pdo, $google2fa, $input) {
    $email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $senha = $input['senha'] ?? '';
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Email inválido']));
    }

    $stmt = $pdo->prepare("SELECT id, senha_hash, mfa_enabled, mfa_secret FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($senha, $user['senha_hash'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Credenciais inválidas']));
    }
    
    if (!$user['mfa_enabled']) {
        $_SESSION['user_id'] = $user['id'];
        die(json_encode(['success' => true, 'mfa_required' => false]));
    }
    
    $mfa_token = bin2hex(random_bytes(16));
    $_SESSION['mfa_tokens'][$mfa_token] = [
        'user_id' => $user['id'],
        'expires' => time() + 300
    ];
    
    die(json_encode([
        'success' => true,
        'mfa_required' => true,
        'mfa_token' => $mfa_token
    ]));
}

function handleVerifyMfa($pdo, $google2fa, $input) {
    $mfa_token = $input['mfa_token'] ?? '';
    $code = $input['code'] ?? '';
    
    if (!isset($_SESSION['mfa_tokens'][$mfa_token])) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Sessão inválida']));
    }
    
    $user_id = $_SESSION['mfa_tokens'][$mfa_token]['user_id'];
    $stmt = $pdo->prepare("SELECT mfa_secret FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    $valid = $google2fa->verifyKey($user['mfa_secret'], $code);
    
    if ($valid) {
        $_SESSION['user_id'] = $user_id;
        unset($_SESSION['mfa_tokens'][$mfa_token]);
        die(json_encode(['success' => true]));
    } else {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Código inválido']));
    }
}

function handleSetupMfa($pdo, $google2fa, $input) {
    if (empty($_SESSION['user_id'])) {
        http_response_code(403);
        die(json_encode(['success' => false, 'message' => 'Não autenticado']));
    }
    
    $email = $input['email'] ?? '';
    $secret = $google2fa->generateSecretKey();
    
    // Geração do QR Code
    $qrCodeUrl = $google2fa->getQRCodeUrl(
        'Nome da Sua Aplicação',
        $email,
        $secret
    );
    
    $renderer = new ImageRenderer(
        new RendererStyle(300),
        new ImagickImageBackEnd()
    );
    $writer = new Writer($renderer);
    $qrCodeImage = 'data:image/png;base64,' . base64_encode($writer->writeString($qrCodeUrl));
    
    $_SESSION['mfa_setup'] = [
        'secret' => $secret,
        'expires' => time() + 900
    ];
    
    die(json_encode([
        'success' => true,
        'secret' => $secret,
        'qr_code' => $qrCodeImage
    ]));
}

function handleConfirmMfa($pdo, $google2fa, $input) {
    if (empty($_SESSION['user_id']) || !isset($_SESSION['mfa_setup'])) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Sessão inválida']));
    }
    
    $code = $input['code'] ?? '';
    $valid = $google2fa->verifyKey($_SESSION['mfa_setup']['secret'], $code);
    
    if ($valid) {
        $stmt = $pdo->prepare("UPDATE usuarios SET mfa_secret = ?, mfa_enabled = 1 WHERE id = ?");
        $stmt->execute([$_SESSION['mfa_setup']['secret'], $_SESSION['user_id']]);
        unset($_SESSION['mfa_setup']);
        die(json_encode(['success' => true]));
    } else {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Código inválido']));
    }
}