<?php
require_once __DIR__ . '/config.php';
session_start();

header('Content-Type: application/json');

$usuario_id = $_SESSION['usuario_id'] ?? null;
if (!$usuario_id) {
    echo json_encode(["erro" => "Usuário não autenticado."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$campos = ['nome', 'telefone', 'cep', 'rua', 'numero', 'estado', 'cidade'];
foreach ($campos as $campo) {
    if (empty($input[$campo])) {
        echo json_encode(["erro" => "Campo $campo está vazio."]);
        exit;
    }
}

$pdo = getDatabaseConnection();

// Verifica se já existe
$stmt = $pdo->prepare("SELECT id FROM dados_cadastrais WHERE usuario_id = ?");
$stmt->execute([$usuario_id]);
$existe = $stmt->fetch();

if ($existe) {
    $sql = "UPDATE dados_cadastrais SET nome = ?, telefone = ?, cep = ?, rua = ?, numero = ?, estado = ?, cidade = ? WHERE usuario_id = ?";
    $params = [
        $input['nome'], $input['telefone'], $input['cep'], $input['rua'],
        $input['numero'], $input['estado'], $input['cidade'], $usuario_id
    ];
} else {
    $sql = "INSERT INTO dados_cadastrais (usuario_id, nome, telefone, cep, rua, numero, estado, cidade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $params = [
        $usuario_id, $input['nome'], $input['telefone'], $input['cep'],
        $input['rua'], $input['numero'], $input['estado'], $input['cidade']
    ];
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode(["sucesso" => true, "mensagem" => "Endereço salvo com sucesso."]);
