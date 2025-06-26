<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cripto_hibrida.php';



$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['encryptedKey'], $data['iv'], $data['encryptedMessage'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Payload criptografado ausente!']);
    exit;
}

try {
    $input = descriptografarEntrada();

    $iv = base64_decode($data['iv']);
    $encryptedMessage = base64_decode($data['encryptedMessage']);
    $decrypted_json = openssl_decrypt($encryptedMessage, 'aes-256-cbc', $aes_key, OPENSSL_RAW_DATA, $iv);
    $input = json_decode($decrypted_json, true);

    if (empty($input['token'])) {
        $resposta = [
            'success' => false,
            'message' => "Token ausente.",
            'debug' => 'Criptografia na volta: resposta de erro criptografada.'
        ];
        resposta_criptografada($resposta, $aes_key, $data['iv']);
    }

    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("SELECT id, ativado FROM usuarios WHERE token_ativacao = :token_ativacao");
    $stmt->execute([':token_ativacao' => $input['token']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        $resposta = [
            'success' => false,
            'message' => 'Token inválido!',
            'debug' => 'Criptografia na volta: resposta de erro criptografada.'
        ];
        resposta_criptografada($resposta, $aes_key, $data['iv']);
    }
    if ($row['ativado']) {
        $resposta = [
            'success' => false,
            'message' => 'Conta já ativada!',
            'debug' => 'Criptografia na volta: resposta de erro criptografada.'
        ];
        resposta_criptografada($resposta, $aes_key, $data['iv']);
    }

    // Ativa usuário e remove token
    $stmt = $pdo->prepare("UPDATE usuarios SET ativado = 1, token_ativacao = NULL WHERE id = :id");
    $stmt->execute([':id' => $row['id']]);

    $resposta = [
        'success' => true,
        'message' => 'Conta ativada com sucesso!',
        'debug' => 'Criptografia na volta: esta resposta foi criptografada com a mesma chave AES da ida.'
    ];
    resposta_criptografada($resposta, $aes_key, $data['iv']);

} catch (Exception $e) {
    $resposta = [
        'success' => false,
        'message' => 'Erro ao ativar a conta.',
        'debug' => 'Criptografia na volta: resposta de erro criptografada.',
        'error' => $e->getMessage()
    ];
    if (!isset($aes_key)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro ao descriptografar a chave AES.']);
        exit;
    }
    resposta_criptografada($resposta, $aes_key, $data['iv']);
}
?>
