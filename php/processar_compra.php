<?php
session_start(); // Ativa a sessão PHP

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Verifica se o usuário está autenticado
if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['sucesso' => false, 'erro' => 'Usuário não autenticado.']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['carrinho']) || !is_array($data['carrinho'])) {
    echo json_encode(['sucesso' => false, 'erro' => 'Carrinho inválido.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=seubanco;charset=utf8', 'usuario', 'senha');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->beginTransaction();

    // Geração de código de pedido formatado
    $stmt = $pdo->query("SELECT MAX(id) AS ultimo_id FROM compras");
    $ultimo_id = $stmt->fetch()['ultimo_id'] ?? 0;

    $ano = date('Y');
    $proximo_id = $ultimo_id + 1;
    $codigo_pedido = sprintf("PED-%s-%05d", $ano, $proximo_id);

    $ids_inseridos = [];

    // Agora sim, insere os itens do carrinho
    foreach ($data['carrinho'] as $item) {
        $stmt = $pdo->prepare("
            INSERT INTO compras (usuario_id, nome_livro, preco, codigo_pedido)
            VALUES (:usuario_id, :nome, :preco, :codigo_pedido)
        ");
        $stmt->execute([
            ':usuario_id' => $usuario_id,
            ':nome' => $item['nome'],
            ':preco' => floatval(str_replace(',', '.', preg_replace('/[^\d,]/', '', $item['preco']))),
            ':codigo_pedido' => $codigo_pedido
        ]);
    }

    $pdo->commit();
    echo json_encode([
        'sucesso' => true,
        'ids_compras' => $ids_inseridos
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['sucesso' => false, 'erro' => $e->getMessage()]);
}
?>
