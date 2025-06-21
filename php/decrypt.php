<?php
// Carrega a chave privada RSA
$privateKeyPath = __DIR__ . '/../keys/private.pem';
$privateKey = openssl_pkey_get_private(file_get_contents($privateKeyPath));


if (!$privateKey) {
    die("Erro ao carregar chave privada");
}

// Recebe dados do front-end (JSON POST)
$data = json_decode(file_get_contents('php://input'), true);

$encryptedKey = base64_decode($data['encryptedKey']);
$iv = base64_decode($data['iv']);
$encryptedMessage = base64_decode($data['encryptedMessage']);

// Descriptografa a chave AES usando a chave RSA privada
if (!openssl_private_decrypt($encryptedKey, $decryptedAesKey, $privateKey)) {
    die("Erro ao descriptografar a chave AES");
}

// Descriptografa a mensagem com AES-256-CBC
$plaintext = openssl_decrypt(
    $encryptedMessage,
    'aes-256-cbc',
    $decryptedAesKey,
    OPENSSL_RAW_DATA,
    $iv
);

echo json_encode([
    "mensagemDescriptografada" => $plaintext
]);
?>
