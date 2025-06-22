<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/cripto_hibrida.php';
require_once __DIR__ . '/hybrid_decrypt.php';
require_once __DIR__ . '/config.php'; // fornece getDatabaseConnection()

use phpseclib3\Exception\BadDecryptionException;

header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents("php://input"), true);

    $temToken = isset($input['encryptedKey'], $input['iv'], $input['encryptedMessage']);

    $dados = $temToken
        ? descriptografarEntrada()
        : json_decode(hybrid_decrypt($input), true);

    $novaSenha  = trim($dados['novaSenha'] ?? '');
    $senhaAtual = $dados['senhaAtual'] ?? null;
    $email      = $dados['email'] ?? null;
    $token      = $dados['token'] ?? null;

    if (strlen($novaSenha) < 12) {
        echo json_encode(["success" => false, "message" => "A nova senha deve ter pelo menos 12 caracteres."]);
        exit;
    }

    if (!$senhaAtual && (!$email || !$token)) {
        echo json_encode(["success" => false, "message" => "Requisição inválida. Use senha atual ou token de redefinição."]);
        exit;
    }

    $pdo = getDatabaseConnection();

    // === FLUXO 1: Redefinição via token (sem login) ===
    if ($token && $email && !$senhaAtual) {
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? AND token_ativacao = ?");
        $stmt->execute([$email, $token]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            echo json_encode(["success" => false, "message" => "Token inválido ou expirado."]);
            exit;
        }

        // Atualiza a senha e remove o token
        $stmt = $pdo->prepare("UPDATE usuarios SET senha_modern_hash = ?, token_ativacao = NULL WHERE id = ?");
        $stmt->execute([password_hash($novaSenha, PASSWORD_DEFAULT), $usuario['id']]);

        echo json_encode(["success" => true, "message" => "Senha redefinida com sucesso."]);
        exit;
    }

    // === FLUXO 2: Alteração logado (com senha atual) ===
    if ($senhaAtual && $email) {
        $stmt = $pdo->prepare("SELECT id, senha_modern_hash FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $usuario = $stmt->fetch();

        if (!$usuario || !password_verify($senhaAtual, $usuario['senha_modern_hash'])) {
            echo json_encode(["success" => false, "message" => "Senha atual incorreta."]);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE usuarios SET senha_modern_hash = ? WHERE id = ?");
        $stmt->execute([password_hash($novaSenha, PASSWORD_DEFAULT), $usuario['id']]);

        echo json_encode(["success" => true, "message" => "Senha alterada com sucesso."]);
        exit;
    }

    echo json_encode(["success" => false, "message" => "Fluxo não reconhecido."]);

} catch (BadDecryptionException $e) {
    echo json_encode(["success" => false, "message" => "Erro ao descriptografar os dados."]);
} catch (Throwable $e) {
    error_log("❌ Erro em trocar_senha.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno ao processar a solicitação."]);
}
