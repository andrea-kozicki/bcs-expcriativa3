<?php
require_once __DIR__ . '/../vendor/autoload.php';

use phpseclib3\Crypt\RSA;
use phpseclib3\Crypt\PublicKeyLoader;

function descriptografarEntrada() {
    $privateKeyPath = __DIR__ . '/../keys/private.pem';

    if (!file_exists($privateKeyPath)) {
        error_log("🔴 Chave privada não encontrada em: $privateKeyPath");
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Arquivo da chave privada não encontrado."]);
        exit;
    }

    $inputJson = file_get_contents('php://input');
    $input = json_decode($inputJson, true);

    if (!$input || !is_array($input)) {
        error_log("🔴 JSON de entrada inválido: $inputJson");
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Entrada JSON malformada."]);
        exit;
    }

    $encryptedKey     = base64_decode($input['encryptedKey'] ?? '', true);
    $iv               = base64_decode($input['iv'] ?? '', true);
    $encryptedMessage = base64_decode($input['encryptedMessage'] ?? '', true);

    error_log("📦 Tamanhos base64 decodificados:");
    error_log("    🔑 encryptedKey: " . ($encryptedKey ? strlen($encryptedKey) : 'inválido'));
    error_log("    🧊 IV: " . ($iv ? strlen($iv) : 'inválido'));
    error_log("    ✉️ encryptedMessage: " . ($encryptedMessage ? strlen($encryptedMessage) : 'inválido'));

    if (!$encryptedKey || !$iv || !$encryptedMessage) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Dados incompletos ou malformados."]);
        exit;
    }

    try {
        $privateKeyString = file_get_contents($privateKeyPath);
        $privateKey = PublicKeyLoader::loadPrivateKey($privateKeyString)
            ->withPadding(RSA::ENCRYPTION_OAEP)
            ->withHash('sha256');

        $aesKey = $privateKey->decrypt($encryptedKey);
    } catch (\Throwable $e) {
        error_log("❌ Erro ao descriptografar com phpseclib: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erro ao descriptografar a chave AES."]);
        exit;
    }

    if (strlen($aesKey) !== 32) {
        error_log("❌ AES key inválida: " . strlen($aesKey) . " bytes");
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Chave AES inválida (esperado 32 bytes)."]);
        exit;
    }

    $plaintext = openssl_decrypt($encryptedMessage, 'aes-256-cbc', $aesKey, OPENSSL_RAW_DATA, $iv);

    if (!$plaintext) {
        error_log("❌ Erro ao descriptografar conteúdo com AES.");
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erro ao descriptografar a mensagem."]);
        exit;
    }

    $dados = json_decode($plaintext, true);
    if (!is_array($dados)) {
        error_log("❌ JSON descriptografado inválido: $plaintext");
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Mensagem descriptografada inválida."]);
        exit;
    }

    return $dados;
}
