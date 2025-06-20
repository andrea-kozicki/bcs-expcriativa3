<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../php/config.php';
$pdo = getDatabaseConnection();

function gerarCodigoPedido(): string {
    return strtoupper(bin2hex(random_bytes(8))); // Ex: A1B2C3D4E5F6A7B8
}

try {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (!isset($dados['carrinho'], $dados['usuario_id']) || !is_array($dados['carrinho'])) {
        echo json_encode(["sucesso" => false, "erro" => "Dados incompletos ou carrinho inválido."]);
        exit;
    }

    $usuario_id = intval($dados['usuario_id']);
    $carrinho = $dados['carrinho'];

    if (count($carrinho) === 0) {
        echo json_encode(["sucesso" => false, "erro" => "Carrinho vazio."]);
        exit;
    }

    // Verifica se o usuário existe
    $check = $pdo->prepare("SELECT id FROM usuarios WHERE id = ?");
    $check->execute([$usuario_id]);

    if ($check->rowCount() === 0) {
        echo json_encode(["sucesso" => false, "erro" => "Usuário não encontrado no banco de dados."]);
        exit;
    }

    $codigo_pedido = gerarCodigoPedido();
    $pdo->beginTransaction();

    // Inserir pedido
    $stmt = $pdo->prepare("INSERT INTO pedidos (usuario_id, codigo_pedido, data_pedido) VALUES (?, ?, NOW())");
    $stmt->execute([$usuario_id, $codigo_pedido]);

    // Inserir itens na tabela compras
    $stmt_item = $pdo->prepare("INSERT INTO compras (usuario_id, livro_id, quantidade, preco_unitario, codigo_pedido, data_compra) VALUES (?, ?, ?, ?, ?, NOW())");

    foreach ($carrinho as $item) {
        $livro_id = $item['id'] ?? null;
        $quantidade = $item['quantidade'] ?? 1;
        $preco = floatval(str_replace(["R$", ","], ["", "."], $item['preco'] ?? '0'));

        if (!$livro_id || !$preco) {
            throw new Exception("Item inválido no carrinho.");
        }

        // Verifica se o livro existe
        $checkLivro = $pdo->prepare("SELECT id FROM livros WHERE id = ?");
        $checkLivro->execute([$livro_id]);
        if ($checkLivro->rowCount() === 0) {
            throw new Exception("Livro com ID $livro_id não encontrado.");
        }

        $stmt_item->execute([$usuario_id, $livro_id, $quantidade, $preco, $codigo_pedido]);
    }

    $pdo->commit();

    echo json_encode([
        "sucesso" => true,
        "codigo_pedido" => $codigo_pedido
    ]);
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        "sucesso" => false, "erro" => $e->getMessage()
    ]);
}
