<?php
ini_set('session.name', 'PHPSESSID');
ini_set('session.cookie_path', '/');
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_secure', 0); // ou 1 se usar HTTPS
session_start();
header('Content-Type: application/json');

require_once 'config.php';

// Verifica se a requisição é POST com ação correta
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || ($_POST['acao'] ?? '') !== 'login') {
    echo json_encode(['success' => false, 'message' => 'Ação inválida.']);
    exit;
}

$email = trim($_POST['email'] ?? '');
$senha = trim($_POST['senha'] ?? '');
$mfa_code = trim($_POST['mfa_code'] ?? '');

if (empty($email) || empty($senha)) {
    echo json_encode(['success' => false, 'message' => 'Preencha todos os campos.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = :email LIMIT 1");
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Email ou senha incorretos.']);
        exit;
    }

    // Verifica MFA
    if (!empty($usuario['mfa_secret']) && $usuario['mfa_enabled']) {
        if (empty($mfa_code)) {
            require_once __DIR__ . '/../vendor/autoload.php';
            $qrCode = \Sonata\GoogleAuthenticator\GoogleQrUrl::generate(
                $usuario['email'],
                $usuario['mfa_secret'],
                'BCS Livraria'
            );
            echo json_encode([
                'success' => true,
                'mfa_required' => true,
                'qr_code_svg' => "<img src=\"$qrCode\" alt=\"QR Code MFA\" />"
            ]);
            exit;
        }

        // Verifica código MFA
        require_once __DIR__ . '/../vendor/autoload.php';
        $g = new \Sonata\GoogleAuthenticator\GoogleAuthenticator();
        if (!$g->checkCode($usuario['mfa_secret'], $mfa_code)) {
            echo json_encode(['success' => false, 'message' => 'Código MFA inválido.']);
            exit;
        }
    }

    // Define variáveis de sessão
    $_SESSION['usuario_id'] = $usuario['id'];
    $_SESSION['usuario_email'] = $usuario['email'];
    $_SESSION['usuario_nome'] = $usuario['nome'] ?? '';
    $_SESSION['usuario_mfa'] = $usuario['mfa_enabled'] ?? 0;
     $_SESSION['LAST_ACTIVITY']  = time();

    session_write_close();

    echo json_encode(['success' => true, 'mfa_required' => false]);
    

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no banco de dados: ' . $e->getMessage()]);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro inesperado: ' . $e->getMessage()]);
    exit;
}
