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
    $stmt = $pdo->prepare("SELECT id, nome, telefone, cpf, data_nascimento, cep, rua, numero, estado, cidade, criado_em 
                           FROM dados_cadastrais 
                           WHERE usuario_id = :usuario_id LIMIT 1");
    $stmt->execute([':usuario_id' => $usuario_id]);
    $dados_cadastrais = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($dados_cadastrais) {
        resposta_criptografada(
            ['success' => true, 'dados_cadastrais' => $dados_cadastrais, 'debug' => 'Criptografia na volta: sucesso'],
            $aesKey,
            base64_encode($iv)
        );
    } else {
        resposta_criptografada(
            ['success' => false, 'message' => 'Dados cadastrais não encontrados.', 'debug' => 'Criptografia na volta: erro'],
            $aesKey,
            base64_encode($iv)
        );
    }
} catch (Exception $e) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Erro ao consultar dados cadastrais.', 'debug' => 'Criptografia na volta: erro', 'error' => $e->getMessage()],
        $aesKey,
        base64_encode($iv)
    );
}
?>
