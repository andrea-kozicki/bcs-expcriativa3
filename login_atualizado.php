// Para suportar controle de sessão (linha 104)
<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once 'config.php';
session_start();

header('Content-Type: application/json');

// Verifica a ação da requisição
$action = $_GET['action'] ?? '';

if ($action === 'get_csrf') {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    echo json_encode(['csrf_token' => $_SESSION['csrf_token']]);
    exit;
}

if ($action !== 'login') {
    echo json_encode(['success' => false, 'message' => 'Ação inválida.']);
    exit;
}

// Processamento do login
try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['email'], $input['senha'], $input['csrf_token'])) {
        throw new Exception("Campos obrigatórios não enviados.");
    }

    // Verificação do CSRF token
    if (!isset($_SESSION['csrf_token']) || $_SESSION['csrf_token'] !== $input['csrf_token']) {
        throw new Exception("CSRF token inválido.");
    }

    $email = trim($input['email']);
    $senha = trim($input['senha']);
    $mfa_code = trim($input['mfa_code'] ?? '');

    $pdo = conectar();
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
        throw new Exception("Credenciais inválidas.");
    }

    // Caso o usuário tenha MFA habilitado
    if ($usuario['mfa_enabled']) {
        if (empty($mfa_code)) {
            echo json_encode([
                'success' => false,
                'mfa_required' => true,
                'message' => 'Insira o código do seu autenticador.'
            ]);
            exit;
        }

        $g = new Sonata\GoogleAuthenticator\GoogleAuthenticator();
        if (!$g->checkCode($usuario['mfa_secret'], $mfa_code)) {
            throw new Exception('Código MFA inválido.');
        }
    }

    // Caso MFA não esteja habilitado, gerar e ativar se o código for válido
    if (!$usuario['mfa_enabled']) {
        if (empty($usuario['mfa_secret'])) {
            // Gerar nova chave MFA
            $secret = (new Sonata\GoogleAuthenticator\GoogleAuthenticator())->generateSecret();
            $stmt = $pdo->prepare("UPDATE usuarios SET mfa_secret = ? WHERE id = ?");
            $stmt->execute([$secret, $usuario['id']]);

            echo json_encode([
                'success' => false,
                'mfa_required' => true,
                'new_mfa_secret' => $secret,
                'message' => 'Escaneie o QR Code com seu autenticador.'
            ]);
            exit;
        } elseif (!empty($mfa_code)) {
            $g = new Sonata\GoogleAuthenticator\GoogleAuthenticator();
            if ($g->checkCode($usuario['mfa_secret'], $mfa_code)) {
                $stmt = $pdo->prepare("UPDATE usuarios SET mfa_enabled = 1 WHERE id = ?");
                $stmt->execute([$usuario['id']]);
            } else {
                throw new Exception("Código inválido. Tente novamente com o código do aplicativo.");
            }
        } else {
            echo json_encode([
                'success' => false,
                'mfa_required' => true,
                'new_mfa_secret' => $usuario['mfa_secret'],
                'message' => 'Escaneie o QR Code e digite o código.'
            ]);
            exit;
        }
    }

    // Tudo validado: criar sessão
    $_SESSION['usuario_id'] = $usuario['id'];
    $_SESSION['usuario_email'] = $usuario['email'];
    $_SESSION['ultimo_acesso'] = time(); // ------> Controle de tempo da sessão
    
    echo json_encode([
        'success' => true,
        'message' => 'Login bem-sucedido.',
        'redirect' => '/bcs-expcriativa3/perfil.html'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
