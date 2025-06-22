<?php
$config = [
  "private_key_bits" => 2048,
  "private_key_type" => OPENSSL_KEYTYPE_RSA,
];
$pair = openssl_pkey_new($config);

openssl_pkey_export($pair, $privateKey);
$details = openssl_pkey_get_details($pair);
$publicKey = $details['key'];

file_put_contents(__DIR__ . '/private.pem', $privateKey);
file_put_contents(__DIR__ . '/public.pem', $publicKey);

echo "✅ Chaves RSA PEM geradas corretamente\n";
