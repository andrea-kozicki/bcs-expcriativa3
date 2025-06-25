<?php
require_once __DIR__ . '/config.php';
require_once 'cripto_hibrida.php';

session_start();
header('Content-Type: application/json');

// Descriptografa a entrada
$entrada = descriptografarEntrada();
$dados = $entrada['dados'];
$aesKey = $entrada['aesKey'];
$iv = $entrada['iv'];

$email = $dados['email'] ?? null;
$senha = $dados['senha'] ?? null;
$acao = $dados['acao'] ?? null;
$mfa_code = $dados['mfa_code'] ?? null;

// Simulação de lógica (ajuste para seu login real)
$pdo = getDatabaseConnection();

try {
    if ($acao === "login") {
        $stmt = $pdo->prepare("SELECT id, senha_modern_hash, email, mfa_enabled, mfa_secret, mfa_qr_exibido, ativado FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            resposta_criptografada(
                ['success' => false, 'message' => 'Usuário ou senha inválidos.'],
                $aesKey,
                base64_encode($iv)
            );
            exit;
        }
        if (!$user['ativado']) {
            resposta_criptografada(
                ['success' => false, 'message' => 'Conta não ativada.'],
                $aesKey,
                base64_encode($iv)
            );
            exit;
        }
        if (!password_verify($senha, $user['senha_modern_hash'])) {
            resposta_criptografada(
                ['success' => false, 'message' => 'Usuário ou senha inválidos.'],
                $aesKey,
                base64_encode($iv)
            );
            exit;
        }

        // MFA
        if ($user['mfa_enabled']) {
            // Simule a lógica de envio de QR se necessário
            $qr_svg = $user['mfa_qr_exibido'] ? null : '<svg><!-- seu qr code aqui --></svg>';
            $_SESSION['usuario_id'] = $user['id'];
            $_SESSION['usuario_email'] = $user['email'];

            resposta_criptografada(
                [
                    'success' => false,
                    'mfa_required' => true,
                    'qr_svg' => $qr_svg,
                    'message' => 'Insira o código MFA.'
                ],
                $aesKey,
                base64_encode($iv)
            );
            exit;
        }

        // Login OK
        $_SESSION['usuario_id'] = $user['id'];
        $_SESSION['usuario_email'] = $user['email'];
        resposta_criptografada(
            [
                'success' => true,
                'usuario_id' => $user['id'],
                'usuario_email' => $user['email'],
                'redirect' => '/perfil.html',
                'message' => 'Login realizado com sucesso.'
            ],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

    if ($acao === "verificar_mfa" && $mfa_code) {
        // Aqui sua lógica de verificação MFA!
        // Exemplo: if (verifica_mfa($user['mfa_secret'], $mfa_code)) { ... }

        // Supondo verificação OK:
        $stmt = $pdo->prepare("SELECT id, email FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        $_SESSION['usuario_id'] = $user['id'];
        $_SESSION['usuario_email'] = $user['email'];
        resposta_criptografada(
            [
                'success' => true,
                'usuario_id' => $user['id'],
                'usuario_email' => $user['email'],
                'redirect' => '/perfil.html',
                'message' => 'Login com MFA realizado com sucesso.'
            ],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

    resposta_criptografada(
        ['success' => false, 'message' => 'Ação inválida.'],
        $aesKey,
        base64_encode($iv)
    );
} catch (Exception $e) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Erro no login.', 'error' => $e->getMessage()],
        $aesKey,
        base64_encode($iv)
    );
}
?>
