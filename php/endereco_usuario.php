<?php
require_once __DIR__ . '/config.php';
session_start();

header('Content-Type: application/json');

$usuario_id = $_SESSION['usuario_id'] ?? null;

if (!$usuario_id) {
    echo json_encode(["erro" => "Usuário não autenticado."]);
    exit;
}

$pdo = getDatabaseConnection();

$stmt = $pdo->prepare("SELECT nome, telefone, cep, rua, numero, estado, cidade FROM dados_cadastrais WHERE usuario_id = ?");
$stmt->execute([$usuario_id]);
$dados = $stmt->fetch();

if ($dados) {
    echo json_encode(["sucesso" => true, "endereco" => $dados]);
} else {
    echo json_encode(["sucesso" => false, "mensagem" => "Endereço não cadastrado."]);
}
