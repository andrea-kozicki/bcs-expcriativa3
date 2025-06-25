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

// Checa campos obrigatórios
$campos = ['nome', 'telefone', 'cpf', 'data_nascimento', 'cep', 'rua', 'numero', 'estado', 'cidade'];
foreach ($campos as $campo) {
    if (empty($dados[$campo])) {
        resposta_criptografada(
            ['success' => false, 'message' => "Campo obrigatório ausente: $campo", 'debug' => 'Criptografia na volta: erro'],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("INSERT INTO dados_cadastrais (usuario_id, nome, telefone, cpf, data_nascimento, cep, rua, numero, estado, cidade) 
                           VALUES (:usuario_id, :nome, :telefone, :cpf, :data_nascimento, :cep, :rua, :numero, :estado, :cidade)");
    $stmt->execute([
        ':usuario_id' => $usuario_id,
        ':nome' => $dados['nome'],
        ':telefone' => $dados['telefone'],
        ':cpf' => $dados['cpf'],
        ':data_nascimento' => $dados['data_nascimento'],
        ':cep' => $dados['cep'],
        ':rua' => $dados['rua'],
        ':numero' => $dados['numero'],
        ':estado' => $dados['estado'],
        ':cidade' => $dados['cidade']
    ]);

    resposta_criptografada(
        ['success' => true, 'message' => 'Dados cadastrais salvos com sucesso!', 'debug' => 'Criptografia na volta: sucesso'],
        $aesKey,
        base64_encode($iv)
    );
} catch (Exception $e) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Erro ao salvar dados cadastrais.', 'debug' => 'Criptografia na volta: erro', 'error' => $e->getMessage()],
        $aesKey,
        base64_encode($iv)
    );
}
?>
