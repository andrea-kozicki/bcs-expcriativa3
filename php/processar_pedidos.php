<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cripto_hibrida.php';

session_start();

$result = descriptografarEntrada();
$dados = $result['dados'];
$aesKey = $result['aesKey'];
$iv = $result['iv'];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$itens = $dados['itens'] ?? [];

if (!$usuario_id) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Usuário não autenticado.', 'debug' => 'Criptografia na volta: erro'],
        $aesKey,
        base64_encode($iv)
    );
    exit;
}
if (!$itens || !is_array($itens)) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Itens do pedido ausentes.', 'debug' => 'Criptografia na volta: erro'],
        $aesKey,
        base64_encode($iv)
    );
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $pdo->beginTransaction();

    // Gera novo codigo_pedido
    $codigo_pedido = bin2hex(random_bytes(8));

    // Cria o pedido
    $stmt = $pdo->prepare("INSERT INTO pedidos (usuario_id, codigo_pedido, data_pedido) VALUES (:usuario_id, :codigo_pedido, NOW())");
    $stmt->execute([':usuario_id' => $usuario_id, ':codigo_pedido' => $codigo_pedido]);
    $pedido_id = $pdo->lastInsertId();

    // Insere itens do pedido na tabela compras
    foreach ($itens as $item) {
        $stmt = $pdo->prepare("INSERT INTO compras (usuario_id, livro_id, quantidade, preco_unitario, codigo_pedido) VALUES (:usuario_id, :livro_id, :quantidade, :preco_unitario, :codigo_pedido)");
        $stmt->execute([
            ':usuario_id' => $usuario_id,
            ':livro_id' => $item['livro_id'],
            ':quantidade' => $item['quantidade'],
            ':preco_unitario' => $item['preco_unitario'],
            ':codigo_pedido' => $codigo_pedido
        ]);
    }

    $pdo->commit();

    resposta_criptografada(
        ['success' => true, 'message' => 'Pedido realizado com sucesso!', 'codigo_pedido' => $codigo_pedido, 'debug' => 'Criptografia na volta: sucesso'],
        $aesKey,
        base64_encode($iv)
    );
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    resposta_criptografada(
        ['success' => false, 'message' => 'Erro ao processar pedido.', 'debug' => 'Criptografia na volta: erro', 'error' => $e->getMessage()],
        $aesKey,
        base64_encode($iv)
    );
}
?>
