<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
$pdo = getDatabaseConnection();

$codigo = $_GET['codigo'] ?? '';

if (!$codigo) {
    echo json_encode(["erro" => "Código do pedido não fornecido."]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT l.titulo, c.quantidade, c.preco_unitario
    FROM compras c
    JOIN livros l ON c.livro_id = l.id
    WHERE c.codigo_pedido = ?
");
$stmt->execute([$codigo]);
$dados = $stmt->fetchAll();

$itens = array_map(function ($item) {
    return [
        "titulo" => $item["titulo"],
        "quantidade" => (int)$item["quantidade"],
        "preco" => "R$ " . number_format($item["preco_unitario"], 2, ",", ".")
    ];
}, $dados);

echo json_encode(["itens" => $itens]);
