<?php
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
$pdo = getDatabaseConnection();

$usuario_id = $_SESSION['usuario_id'] ?? $_POST['usuario_id'] ?? null;

if (!$usuario_id) {
    echo json_encode(["erro" => "Usuário não identificado."]);
    exit;
}

$sql = "
    SELECT 
        p.codigo_pedido,
        p.data_pedido,
        COALESCE(SUM(c.quantidade * c.preco_unitario), 0) AS total,
        MAX(pg.status_pagamento) AS status_pagamento
    FROM pedidos p
    LEFT JOIN compras c ON c.codigo_pedido = p.codigo_pedido
    LEFT JOIN pagamentos pg ON pg.compra_id = c.id
    WHERE p.usuario_id = ?
    GROUP BY p.codigo_pedido, p.data_pedido
    ORDER BY p.data_pedido DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$usuario_id]);
$pedidos = $stmt->fetchAll();

echo json_encode($pedidos);
