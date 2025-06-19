<?php
require_once "config.php";

header("Content-Type: text/html; charset=UTF-8");

$pdo = getDatabaseConnection();

if (!isset($_GET["token"]) || empty($_GET["token"])) {
    http_response_code(400);
    echo "Código de ativação não fornecido.";
    exit;
}

$token = $_GET["token"];

// Busca o usuário com o token
$stmt = $pdo->prepare("SELECT id FROM usuarios WHERE token_ativacao = ?");
$stmt->execute([$token]);
$usuario = $stmt->fetch();

if (!$usuario) {
    http_response_code(404);
    echo "Token inválido ou já utilizado.";
    exit;
}

// Atualiza: ativa e limpa o token
$stmt = $pdo->prepare("UPDATE usuarios SET ativado = 1, token_ativacao = NULL WHERE id = ?");
$stmt->execute([$usuario["id"]]);

echo "Conta ativada com sucesso! Você já pode fazer login.";
