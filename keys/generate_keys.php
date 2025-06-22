<?php
$dir = __DIR__ . '/../keys';

if (!is_dir($dir)) {
    mkdir($dir, 0700, true);
}

$config = [
    "private_key_bits" => 2048,
    "private_key_type" => OPENSSL_KEYTYPE_RSA,
];

$keys = openssl_pkey_new($config);

// Exporta chave privada
openssl_pkey_export($keys, $privateKey);
file_put_contents("$dir/private.pem", $privateKey);

// Exporta chave pública
$publicKeyDetails = openssl_pkey_get_details($keys);
$publicKey = $publicKeyDetails['key'];
file_put_contents("$dir/public.pem", $publicKey);

echo "✅ Chaves geradas com sucesso em: $dir\n";
