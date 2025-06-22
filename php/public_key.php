<?php
$publicKeyPath = __DIR__ . '/../keys/public.pem';

if (!file_exists($publicKeyPath)) {
    http_response_code(500);
    echo json_encode(["error" => "Chave não encontrada"]);
    exit;
}

$pem = file_get_contents($publicKeyPath);

// Remove os cabeçalhos e quebras de linha (PEM → base64 limpa)
$cleaned = preg_replace('/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s+/', '', $pem);

header('Content-Type: application/json');
echo json_encode(["publicKey" => $cleaned]);
?>
