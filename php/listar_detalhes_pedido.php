<?php
session_start();
header('Content-Type: application/json');

// Verifica se o usuário está logado
if (!isset($_SESSION['usuario_email'])) {
    echo json_encode(["erro" => "Usuário não autenticado."]);
    exit;
}

$email = $_SESSION['usuario_email'];
$codigo = $_GET['codigo'] ?? null;

if (!$codigo) {
    echo json_encode(["erro" => "Código do pedido não fornecido."]);
    exit;
}

$caminho = "../dados/pedidos.json";

if (!file_exists($caminho)) {
    echo json_encode(["erro" => "Arquivo de pedidos não encontrado."]);
    exit;
}

$dados = json_decode(file_get_contents($caminho), true);
if (!is_array($dados)) {
    echo json_encode(["erro" => "Erro ao processar dados do pedido."]);
    exit;
}

// Procura o pedido correspondente
foreach ($dados as $pedido) {
    if (
        isset($pedido['codigo_pedido'], $pedido['email'], $pedido['itens']) &&
        $pedido['codigo_pedido'] === $codigo &&
        $pedido['email'] === $email
    ) {
        echo json_encode(["itens" => $pedido['itens']]);
        exit;
    }
}

echo json_encode(["erro" => "Pedido não encontrado."]);
