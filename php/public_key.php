<?php
// Caminho absoluto para o arquivo .pem
$publicKeyPath = __DIR__ . '/../keys/public.pem';

$publicKey = file_get_contents($publicKeyPath);

header('Content-Type: application/json');
echo json_encode([
    "publicKey" => $publicKey
]);
?>
