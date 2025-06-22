<?php
$key = file_get_contents(__DIR__ . '/private.pem');
$res = openssl_pkey_get_private($key);

if ($res === false) {
    echo "❌ Erro ao carregar a chave privada.\n";
} else {
    echo "✅ Chave privada carregada com sucesso.\n";
}

