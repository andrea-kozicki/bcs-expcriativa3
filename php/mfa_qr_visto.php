<?php
require_once __DIR__ . '/config.php';
session_start();

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Não autenticado."]);
    exit;
}

$id = $_SESSION['usuario_id'];

$stmt = $pdo->prepare("UPDATE usuarios SET mfa_qr_exibido = 1 WHERE id = ?");
$stmt->execute([$id]);

echo json_encode(["success" => true]);
