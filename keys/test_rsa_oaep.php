<?php
$privateKeyPem = file_get_contents(__DIR__ . '/../keys/private.pem');
$privateKey = openssl_pkey_get_private($privateKeyPem);

$publicKeyPem = file_get_contents(__DIR__ . '/../keys/public.pem');
$publicKey = openssl_pkey_get_public($publicKeyPem);

// Mensagem de teste
$mensagem = "test-aes-key";

// Criptografa com chave pública
openssl_public_encrypt($mensagem, $encrypted, $publicKey, OPENSSL_PKCS1_OAEP_PADDING);

// Tenta descriptografar com a privada
if (!openssl_private_decrypt($encrypted, $decrypted, $privateKey, OPENSSL_PKCS1_OAEP_PADDING)) {
    echo "❌ Falha ao descriptografar com OPENSSL_PKCS1_OAEP_PADDING\n";
} else {
    echo "✅ Sucesso: $decrypted\n";
}
