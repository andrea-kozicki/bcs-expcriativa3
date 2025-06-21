<?php

// Garante que a pasta 'keys/' exista
if (!is_dir('keys')) {
    mkdir('keys', 0700, true);
}

// Geração do par de chaves RSA
$config = [
    "private_key_bits" => 2048,
    "private_key_type" => OPENSSL_KEYTYPE_RSA,
];

$keys = openssl_pkey_new($config);

// Exporta chave privada
openssl_pkey_export($keys, $privateKey);
file_put_contents('keys/private.pem', $privateKey);

// Exporta chave pública
$publicKeyDetails = openssl_pkey_get_details($keys);
$publicKey = $publicKeyDetails['key'];
file_put_contents('keys/public.pem', $publicKey);

echo "Chaves geradas com sucesso!";
?>
