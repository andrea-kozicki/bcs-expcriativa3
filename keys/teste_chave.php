<?php
$privateKeyPath = __DIR__ . '/private.pem';
$publicKeyPath = __DIR__ . '/public.pem';

$privKey = file_get_contents($privateKeyPath);
$pubKey = file_get_contents($publicKeyPath);

$private = openssl_pkey_get_private($privKey);
$public = openssl_pkey_get_public($pubKey);

if (!$private || !$public) {
    die("❌ Erro ao carregar chaves.\n");
}

$data = "teste-segredo";

// Criptografa com a chave pública (OAEP)
if (!openssl_public_encrypt($data, $encrypted, $public, OPENSSL_PKCS1_OAEP_PADDING)) {
    die("❌ Falha ao criptografar com chave pública.\n");
}

// Descriptografa com a chave privada
if (!openssl_private_decrypt($encrypted, $decrypted, $private, OPENSSL_PKCS1_OAEP_PADDING)) {
    die("❌ Falha ao descriptografar com chave privada.\n");
}

echo "✅ Sucesso! Mensagem descriptografada: $decrypted\n";
