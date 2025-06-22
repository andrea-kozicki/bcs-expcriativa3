<?php
$dir = __DIR__;
$privatePath = "$dir/private.pem";
$publicPath  = "$dir/public.pem";

$config = [
    "private_key_type" => OPENSSL_KEYTYPE_RSA,
    "private_key_bits" => 2048,
];

$res = openssl_pkey_new($config);

if (!$res) {
    die("❌ Erro ao gerar chave.\n");
}

openssl_pkey_export($res, $privateKeyPem); // exporta privada

$details = openssl_pkey_get_details($res);
$publicKeyPem = $details['key']; // PEM pública

file_put_contents($privatePath, $privateKeyPem);
file_put_contents($publicPath, $publicKeyPem);

echo "✅ Chaves RSA geradas no formato correto!\n";
echo "🔐 Privada: $privatePath\n";
echo "🔓 Pública: $publicPath\n";
?>
