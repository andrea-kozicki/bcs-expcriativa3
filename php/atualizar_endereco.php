<?php
session_start();
require_once 'config.php';
require_once 'cripto_hibrida.php';

header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['success' => false, 'message' => 'Sessão inválida.']);
    exit;
}

$dados = descriptografarEntrada();
$usuarioId = $_SESSION['usuario_id'];

$campos = ['cep', 'rua', 'numero', 'cidade', 'estado'];
foreach ($campos as $campo) {
    if (empty($dados[$campo])) {
        echo json_encode(['success' => false, 'message' => "Campo '$campo' obrigatório."]);
        exit;
    }
}

try {
    $stmt = $pdo->prepare("UPDATE dados_cadastrais SET cep = ?, rua = ?, numero = ?, cidade = ?, estado = ? WHERE usuario_id = ?");
    $stmt->execute([
        $dados['cep'],
        $dados['rua'],
        $dados['numero'],
        $dados['cidade'],
        $dados['estado'],
        $usuarioId
    ]);

    echo json_encode(['success' => true, 'message' => 'Endereço atualizado com sucesso.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar o banco de dados.']);
}
