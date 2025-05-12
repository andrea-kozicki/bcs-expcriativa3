<?php
require_once __DIR__ . '/../php/config.php';
header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Requisição inválida.');
    }

    $token      = trim($_POST['token'] ?? '');
    $senhaHash  = trim($_POST['senha_hash'] ?? '');
    $salt       = trim($_POST['salt'] ?? '');

    if (!$token || !$senhaHash || !$salt) {
        throw new Exception('Token, senha ou salt ausente.');
    }

    $pdo = getDatabaseConnection();

    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE token_ativacao = :token");
    $stmt->execute([':token' => $token]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        throw new Exception('Token inválido ou expirado.');
    }

    $usuarioId = $usuario['id'];

    $pdo->beginTransaction();

    // Atualiza a senha na tabela usuarios
    $update = $pdo->prepare("
        UPDATE usuarios
        SET senha_hash = :senha_hash, salt = :salt, token_ativacao = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");
    $update->execute([
        ':senha_hash' => $senhaHash,
        ':salt' => $salt,
        ':id' => $usuarioId
    ]);

    // Registra o histórico da senha
    $log = $pdo->prepare("
        INSERT INTO historico_senhas (usuario_id, senha_hash, salt)
        VALUES (:usuario_id, :senha_hash, :salt)
    ");
    $log->execute([
        ':usuario_id' => $usuarioId,
        ':senha_hash' => $senhaHash,
        ':salt' => $salt
    ]);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Senha atualizada com sucesso!']);
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
}
