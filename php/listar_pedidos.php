<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cripto_hibrida.php';

session_start();

$result = descriptografarEntrada();
$dados = $result['dados'];
$aesKey = $result['aesKey'];
$iv = $result['iv'];

$usuario_id = $_SESSION['usuario_id'] ?? null;

if (!$usuario_id) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Usuário não autenticado.', 'debug' => 'Criptografia na volta: erro'],
        $aesKey,
        base64_encode($iv)
    );
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("SELECT id, codigo_pedido, data_pedido FROM pedidos WHERE usuario_id = :usuario_id ORDER BY data_pedido DESC");
    $stmt->execute([':usuario_id' => $usuario_id]);
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    resposta_criptografada(
        ['success' => true, 'pedidos' => $pedidos, 'debug' => 'Criptografia na volta: sucesso'],
        $aesKey,
        base64_encode($iv)
    );
} catch (Exception $e) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Erro ao listar pedidos.', 'debug' => 'Criptografia na volta: erro', 'error' => $e->getMessage()],
        $aesKey,
        base64_encode($iv)
    );
}
?>
