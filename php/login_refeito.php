<?php
session_start();
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../vendor/autoload.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


use Sonata\GoogleAuthenticator\GoogleAuthenticator;

// === [1] GET: CSRF Token ====================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $_GET['action'] === 'get_csrf') {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    echo json_encode([
        'success' => true,
        'token' => $_SESSION['csrf_token']
    ]);
    exit;
}

// === [2] Função: Validação de token CSRF ====================================
function validar_csrf_token($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// === [3] POST: Ações protegidas =============================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action'])) {
    header('Content-Type: application/json');

    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'];

    if (!isset($input['csrf_token']) || !validar_csrf_token($input['csrf_token'])) {
        echo json_encode(['success' => false, 'message' => 'CSRF token inválido.']);
        exit;
    }

    if ($action === 'login') {
        if (!isset($input['email']) || !isset($input['senha'])) {
            echo json_encode(['success' => false, 'message' => 'Email e senha obrigatórios.']);
            exit;
        }

        $email = trim($input['email']);
        $senha = $input['senha'];
        $mfa_code = $input['mfa_code'] ?? null;

        try {
            $pdo = getDatabaseConnection();
            $stmt = $pdo->prepare("SELECT id, email, senha_hash, mfa_secret FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
                echo json_encode(['success' => false, 'message' => 'Credenciais inválidas.']);
                exit;
            }

            if (!empty($usuario['mfa_secret'])) {
                if (!$mfa_code) {
                    echo json_encode(['success' => false, 'mfa_required' => true]);
                    exit;
                }

                $g = new GoogleAuthenticator();
                if (!$g->checkCode($usuario['mfa_secret'], $mfa_code)) {
                    echo json_encode(['success' => false, 'message' => 'Código MFA inválido.']);
                    exit;
                }
            }

            $_SESSION['user_id'] = $usuario['id'];
            $_SESSION['email'] = $usuario['email'];
            echo json_encode(['success' => true]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
        }

        exit;
    }

    // === Ação desconhecida ==================================================
    echo json_encode(['success' => false, 'message' => 'Ação inválida.']);
    exit;
}

// === [4] Método não permitido ===============================================
http_response_code(405);
echo 'Método não permitido.';
