<?php
function descriptografarEntrada() {
    $privateKeyPath = __DIR__ . '/../keys/private.pem';
    $privateKey = openssl_pkey_get_private(file_get_contents($privateKeyPath));

    if (!$privateKey) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erro ao carregar chave privada."]);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $encryptedKey = base64_decode($input['encryptedKey'] ?? '');
    $iv = base64_decode($input['iv'] ?? '');
    $encryptedMessage = base64_decode($input['encryptedMessage'] ?? '');

    if (!$encryptedKey || !$iv || !$encryptedMessage) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Dados incompletos para descriptografar."]);
        exit;
    }

    if (!openssl_private_decrypt($encryptedKey, $aesKey, $privateKey)) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erro ao descriptografar a chave AES."]);
        exit;
    }

    $plaintext = openssl_decrypt($encryptedMessage, 'aes-256-cbc', $aesKey, OPENSSL_RAW_DATA, $iv);

    if (!$plaintext) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erro ao descriptografar a mensagem."]);
        exit;
    }

    return json_decode($plaintext, true);
}
