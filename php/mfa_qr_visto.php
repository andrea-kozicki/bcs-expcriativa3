<?php
require_once __DIR__ . '/config.php';
require_once 'cripto_hibrida.php';

session_start();
header('Content-Type: application/json');

$entrada = descriptografarEntrada();
$dados = $entrada['dados'];
$aesKey = $entrada['aesKey'];
$iv = $entrada['iv'];

$usuario_id = $_SESSION['usuario_id'] ?? null;

if (!$usuario_id) {
    resposta_criptografada(
        [ 'success' => false, 'message' => 'Usuário não autenticado.' ],
        $aesKey,
        base64_encode($iv)
    );
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("UPDATE usuarios SET mfa_qr_exibido = 1 WHERE id = ?");
    $stmt->execute([$usuario_id]);

    resposta_criptografada(
        [ 'success' => true, 'message' => 'QR marcado como visto.' ],
        $aesKey,
        base64_encode($iv)
    );
} catch (Exception $e) {
    resposta_criptografada(
        [ 'success' => false, 'message' => 'Erro ao atualizar.', 'error' => $e->getMessage() ],
        $aesKey,
        base64_encode($iv)
    );
}
?>
