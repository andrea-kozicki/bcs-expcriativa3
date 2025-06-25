<?php
require_once __DIR__ . '/config.php';
require_once 'cripto_hibrida.php';

session_start();
header('Content-Type: application/json');

try {
    $entrada = descriptografarEntrada();
    $dados = $entrada['dados'];
    $aesKey = $entrada['aesKey'];
    $iv = $entrada['iv'];

    session_unset();
    session_destroy();

    resposta_criptografada(
        [ 'success' => true, 'message' => 'Logout realizado com sucesso.' ],
        $aesKey,
        base64_encode($iv)
    );
} catch (Exception $e) {
    resposta_criptografada(
        [ 'success' => false, 'message' => 'Erro ao fazer logout.', 'error' => $e->getMessage() ],
        $aesKey ?? '',
        isset($iv) ? base64_encode($iv) : ''
    );
}
?>
