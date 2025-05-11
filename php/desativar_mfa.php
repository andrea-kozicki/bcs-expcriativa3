<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autenticado']);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("UPDATE usuarios SET mfa_enabled = 0, mfa_secret = NULL WHERE id = :id");
    $stmt->execute([':id' => $_SESSION['user_id']]);

    echo json_encode(['success' => true, 'message' => 'MFA desativado com sucesso']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao desativar MFA: ' . $e->getMessage()]);
}
