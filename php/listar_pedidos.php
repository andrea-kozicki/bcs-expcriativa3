<?php
session_start();
header('Content-Type: application/json');

// Verifica se o usuário está logado
if (!isset($_SESSION['usuario_email'])) {
    echo json_encode(["erro" => "Usuário não autenticado."]);
    exit;
}

$email = $_SESSION['usuario_email'];
$arquivo = "../dados/pedidos.json";

if (!file_exists($arquivo)) {
    echo json_encode([]);
    exit;
}

// Carrega todos os pedidos
$pedidos = json_decode(file_get_contents($arquivo), true);
if (!is_array($pedidos)) {
    echo json_encode([]);
    exit;
}

// Filtra pedidos do usuário logado
$meus_pedidos = array_filter($pedidos, function($pedido) use ($email) {
    return isset($pedido['email']) && $pedido['email'] === $email;
});

echo json_encode(array_values($meus_pedidos));
