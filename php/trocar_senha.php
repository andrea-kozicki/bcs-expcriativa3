<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once 'cripto_hibrida.php';

session_start();
header('Content-Type: application/json');

// 1. Descriptografa a entrada e pega a AES/IV
$entrada = descriptografarEntrada();
$dados = $entrada['dados'];
$aesKey = $entrada['aesKey'];
$iv = $entrada['iv'];

// 2. Identifica fluxo: troca logada (sessão) OU redefinição via token/email
$usuario_id = $_SESSION['usuario_id'] ?? null;
$email = $dados['email'] ?? null;
$token = $dados['token'] ?? null;
$novaSenha = $dados['novaSenha'] ?? null;
$senhaAtual = $dados['senhaAtual'] ?? null;

if (!$novaSenha || strlen($novaSenha) < 12) {
    resposta_criptografada(
        ['success' => false, 'message' => 'A senha deve ter pelo menos 12 caracteres.', 'debug' => 'Criptografia na volta: erro'],
        $aesKey,
        base64_encode($iv)
    );
    exit;
}

$pdo = getDatabaseConnection();

try {
    // Fluxo: usuário autenticado (trocando a própria senha pelo perfil)
    if ($usuario_id && $senhaAtual) {
        // Busca usuário pelo ID
        $stmt = $pdo->prepare("SELECT senha_modern_hash FROM usuarios WHERE id = ?");
        $stmt->execute([$usuario_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            resposta_criptografada(
                ['success' => false, 'message' => 'Usuário não encontrado.', 'debug' => 'Criptografia na volta: erro'],
                $aesKey,
                base64_encode($iv)
            );
            exit;
        }
        // Valida senha atual
        if (!password_verify($senhaAtual, $user['senha_modern_hash'])) {
            resposta_criptografada(
                ['success' => false, 'message' => 'Senha atual incorreta.', 'debug' => 'Criptografia na volta: erro'],
                $aesKey,
                base64_encode($iv)
            );
            exit;
        }

        // Atualiza para a nova senha
        $nova_hash = password_hash($novaSenha, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE usuarios SET senha_modern_hash = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$nova_hash, $usuario_id]);

        resposta_criptografada(
            ['success' => true, 'message' => 'Senha alterada com sucesso!', 'debug' => 'Criptografia na volta: sucesso'],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

    // Fluxo: redefinição via e-mail + token
    if ($email && $token) {
        // Busca usuário pelo e-mail e token válido
        $stmt = $pdo->prepare("SELECT id, token_ativacao FROM usuarios WHERE email = ? AND token_ativacao = ?");
        $stmt->execute([$email, $token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            resposta_criptografada(
                ['success' => false, 'message' => 'E-mail ou token inválido.', 'debug' => 'Criptografia na volta: erro'],
                $aesKey,
                base64_encode($iv)
            );
            exit;
        }

        // Atualiza a senha e remove o token
        $nova_hash = password_hash($novaSenha, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE usuarios SET senha_modern_hash = ?, token_ativacao = NULL, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$nova_hash, $user['id']]);

        resposta_criptografada(
            ['success' => true, 'message' => 'Senha redefinida com sucesso!', 'debug' => 'Criptografia na volta: sucesso'],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

    // Caso falhe em todas as verificações:
    resposta_criptografada(
        ['success' => false, 'message' => 'Requisição inválida.', 'debug' => 'Criptografia na volta: erro'],
        $aesKey,
        base64_encode($iv)
    );

} catch (Exception $e) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Erro ao trocar senha: ' . $e->getMessage(), 'debug' => 'Criptografia na volta: erro'],
        $aesKey,
        base64_encode($iv)
    );
}
?>
