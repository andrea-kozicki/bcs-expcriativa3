<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php'; // ⚠️ Certifique-se de que esse caminho está correto

// Gera um CSRF token seguro se ainda não existir
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

if (isset($_SESSION['user_id'])) {
    // 🔍 Buscar o valor de mfa_enabled do banco
    try {
        $conn = getDatabaseConnection();
        $stmt = $conn->prepare("SELECT mfa_enabled FROM usuarios WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $mfa_enabled = $stmt->fetchColumn();
    } catch (Exception $e) {
        // Em caso de erro, assume 0 (não ativado)
        $mfa_enabled = 0;
    }

    echo json_encode([
        'logged_in'   => true,
        'user_id'     => $_SESSION['user_id'],
        'email'       => $_SESSION['email'] ?? null,
        'csrf_token'  => $_SESSION['csrf_token'],
        'mfa_enabled' => $_SESSION['mfa_enabled'] ?? 0,
    ]);
} else {
    echo json_encode([
        'logged_in'  => false,
        'csrf_token' => $_SESSION['csrf_token']
    ]);
}


