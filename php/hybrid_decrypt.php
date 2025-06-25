<?php
use phpseclib3\Crypt\AES;
use phpseclib3\Crypt\RSA;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Exception\BadDecryptionException;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/cripto_hibrida.php';
session_start();

function hybrid_decrypt(array $payload): string {
    if (!isset($_SESSION['privateKey'])) {
        throw new Exception("Chave privada da sessão não encontrada.");
    }

    $encryptedKey = base64_decode($payload['key'] ?? '');
    $encryptedData = base64_decode($payload['data'] ?? '');

    if (!$encryptedKey || !$encryptedData) {
        throw new Exception("Dados criptografados ausentes ou inválidos.");
    }

    $private = $_SESSION['privateKey'];

    try {
        $privateKey = PublicKeyLoader::loadPrivateKey($private)
            ->withPadding(RSA::ENCRYPTION_OAEP)
            ->withHash('sha256');

        $aesKey = $privateKey->decrypt($encryptedKey);
    } catch (BadDecryptionException $e) {
        throw new Exception("Erro ao descriptografar chave AES: " . $e->getMessage());
    } catch (\Throwable $e) {
        throw new Exception("Erro ao carregar chave privada: " . $e->getMessage());
    }

    $aes = new AES('cbc');
    $aes->setKey($aesKey);
    $aes->setIV(substr($aesKey, 0, 16)); // Compatível com a estratégia usada no JS

    $plaintext = $aes->decrypt($encryptedData);

    if (!$plaintext) {
        throw new Exception("Falha ao descriptografar os dados.");
    }

    return $plaintext;
}
