<?php

// Adicione no início do arquivo
error_reporting(E_ALL);
ini_set('display_errors', 1);

// No início do arquivo
file_put_contents('debug.log', date('Y-m-d H:i:s') . " - Requisição recebida\n", FILE_APPEND);
file_put_contents('debug.log', print_r($_SERVER, true) . "\n", FILE_APPEND);
file_put_contents('debug.log', print_r($_POST, true) . "\n", FILE_APPEND);


session_start();
require_once '../vendor/autoload.php';


// Adicione headers para CORS (se necessário)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");
header("Content-Type: application/json");
header("Access-Control-Allow-Credentials: true");

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\ImagickImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

$google2fa = new Google2FA();

$pdo = new PDO('mysql:host=localhost;port:3600;dbname=testelogin', 'usuario', 'senha');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

//Conexão com o banco
try {
    $pdo = new PDO('mysql:host=localhost;dbname=testelogin', 'usuario', 'senha');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'Erro de conexão com o banco: ' . $e->getMessage()]));
}

// Verifique se o Google2FA está instalado corretamente
if (!class_exists('PragmaRX\Google2FA\Google2FA')) {
    die(json_encode(['success' => false, 'message' => 'Biblioteca Google2FA não encontrada']));
}


// Gerar CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Endpoint para login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'login') {
        $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
        $senha = $_POST['senha'] ?? '';
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Email inválido']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($senha, $user['senha_hash'])) {
            echo json_encode(['success' => false, 'message' => 'Credenciais inválidas']);
            exit;
        }
        
        if (!$user['mfa_enabled']) {
            $_SESSION['user_id'] = $user['id'];
            echo json_encode(['success' => true, 'mfa_required' => false]);
            exit;
        }
        
        $mfa_token = bin2hex(random_bytes(16));
        $_SESSION['mfa_tokens'][$mfa_token] = [
            'user_id' => $user['id'],
            'expires' => time() + 300
        ];
        
        echo json_encode([
            'success' => true,
            'mfa_required' => true,
            'mfa_token' => $mfa_token
        ]);
    }
    elseif ($_POST['action'] === 'verify_mfa') {
        $mfa_token = $_POST['mfa_token'] ?? '';
        $code = $_POST['code'] ?? '';
        
        if (!isset($_SESSION['mfa_tokens'][$mfa_token])) {
            echo json_encode(['success' => false, 'message' => 'Sessão inválida']);
            exit;
        }
        
        $user_id = $_SESSION['mfa_tokens'][$mfa_token]['user_id'];
        $stmt = $pdo->prepare("SELECT mfa_secret FROM usuarios WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        $valid = $google2fa->verifyKey($user['mfa_secret'], $code);
        
        if ($valid) {
            $_SESSION['user_id'] = $user_id;
            unset($_SESSION['mfa_tokens'][$mfa_token]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Código inválido']);
        }
    }
    elseif ($_POST['action'] === 'setup_mfa') {
        $email = $_POST['email'] ?? '';
        $secret = $google2fa->generateSecretKey();
        
        $qrCodeUrl = $google2fa->getQRCodeUrl('Sua Aplicação', $email, $secret);
        $renderer = new ImageRenderer(new RendererStyle(300), new ImagickImageBackEnd());
        $writer = new Writer($renderer);
        $qrCodeImage = 'data:image/png;base64,' . base64_encode($writer->writeString($qrCodeUrl));
        
        $_SESSION['mfa_setup'] = [
            'secret' => $secret,
            'expires' => time() + 900
        ];
        
        echo json_encode([
            'success' => true,
            'secret' => $secret,
            'qr_code' => $qrCodeImage
        ]);
    }
    elseif ($_POST['action'] === 'confirm_mfa') {
        $code = $_POST['code'] ?? '';
        
        if (!isset($_SESSION['mfa_setup'])) {
            echo json_encode(['success' => false, 'message' => 'Sessão inválida']);
            exit;
        }
        
        $valid = $google2fa->verifyKey($_SESSION['mfa_setup']['secret'], $code);
        
        if ($valid) {
            $stmt = $pdo->prepare("UPDATE usuarios SET mfa_secret = ?, mfa_enabled = 1 WHERE id = ?");
            $stmt->execute([$_SESSION['mfa_setup']['secret'], $_SESSION['user_id']]);
            unset($_SESSION['mfa_setup']);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Código inválido']);
        }
    }
}

// No final de cada bloco de ação
file_put_contents('debug.log', "Resposta enviada: " . json_encode($responseData) . "\n\n", FILE_APPEND);
?>