<?php
$publicKeyPath = __DIR__ . '/../keys/public.pem';
$publicKeyPem = file_get_contents($publicKeyPath);

$cleaned = preg_replace('/-----.*?-----/', '', $publicKeyPem); // remove cabeçalhos PEM
$cleaned = str_replace(["\r", "\n"], '', $cleaned); // remove quebras de linha

header('Content-Type: application/json');
echo json_encode([
    "publicKey" => $cleaned
]);
