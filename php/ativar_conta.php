<?php
require_once __DIR__ . '/config.php';

$token = $_GET['token'] ?? '';

if (!$token) {
    echo "Token ausente na URL.";
    exit;
}

$stmt = $pdo->prepare("SELECT id, ativado FROM usuarios WHERE token_ativacao = ?");
$stmt->execute([$token]);
$usuario = $stmt->fetch();

if (!$usuario) {
    echo "Token inválido ou expirado.";
    exit;
}

if ((int)$usuario['ativado'] === 1) {
    echo "Conta já está ativada.";
    exit;
}

$stmt = $pdo->prepare("UPDATE usuarios SET ativado = 1, token_ativacao = NULL WHERE id = ?");
$stmt->execute([$usuario['id']]);

echo "Conta ativada com sucesso. Você já pode fazer login.";
