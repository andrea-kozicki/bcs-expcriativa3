<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cripto_hibrida.php';

session_start();

$result = descriptografarEntrada();
$dados = $result['dados'];
$aesKey = $result['aesKey'];
$iv = $result['iv'];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$codigo_pedido = $dados['codigo_pedido'] ?? null;

if (!$usuario_id) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Usuário não autenticado.', 'debug' => 'Criptografia na volta: erro'],
        $aesKey,
        base64_encode($iv)
    );
    exit;
}
if (!$codigo_pedido) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Código do pedido não informado.', 'debug' => 'Criptografia na volta: erro'],
        $aesKey,
        base64_encode($iv)
    );
    exit;
}

try {
    $pdo = getDatabaseConnection();

    // Confirma que o pedido pertence ao usuário
    $stmt = $pdo->prepare("SELECT id FROM pedidos WHERE codigo_pedido = :codigo_pedido AND usuario_id = :usuario_id");
    $stmt->execute([':codigo_pedido' => $codigo_pedido, ':usuario_id' => $usuario_id]);
    if (!$stmt->fetch()) {
        resposta_criptografada(
            ['success' => false, 'message' => 'Pedido não encontrado ou não pertence ao usuário.', 'debug' => 'Criptografia na volta: erro'],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

    // Busca os itens do pedido (compras)
    $stmt = $pdo->prepare("SELECT id, livro_id, quantidade, preco_unitario, total, data_compra FROM compras WHERE codigo_pedido = :codigo_pedido");
    $stmt->execute([':codigo_pedido' => $codigo_pedido]);
    $itens = $stmt->fetchAll(PDO::FETCH_ASSOC);

    resposta_criptografada(
        ['success' => true, 'itens' => $itens, 'debug' => 'Criptografia na volta: sucesso'],
        $aesKey,
        base64_encode($iv)
    );
} catch (Exception $e) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Erro ao listar detalhes do pedido.', 'debug' => 'Criptografia na volta: erro', 'error' => $e->getMessage()],
        $aesKey,
        base64_encode($iv)
    );
}
?>
