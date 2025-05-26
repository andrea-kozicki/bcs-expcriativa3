<?php
// Mostra erros (útil para debug em ambiente local)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Carrega dependências
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/config.php';

header('Content-Type: text/html; charset=UTF-8');

// Verifica se o código foi fornecido
if (!isset($_GET['codigo']) || empty($_GET['codigo'])) {
    http_response_code(400);
    echo "<h2>Código de ativação não fornecido.</h2>";
    exit;
}

$codigo = $_GET['codigo'];

try {
    // Verifica se existe um usuário com esse token
    $stmt = $pdo->prepare("SELECT id, ativado FROM usuarios WHERE token_ativacao = :codigo");
    $stmt->execute([':codigo' => $codigo]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        http_response_code(404);
        echo "<h2>Código de ativação inválido ou já utilizado.</h2>";
        exit;
    }

    if ($usuario['ativado'] == 1) {
        echo "<h2>Sua conta já está ativada.</h2>";
        exit;
    }

    // Ativa o usuário
    $stmt = $pdo->prepare("UPDATE usuarios SET ativado = 1, token_ativacao = NULL WHERE id = :id");
    $stmt->execute([':id' => $usuario['id']]);

    echo "<p>Conta ativada com sucesso! Você será redirecionado para o login em instantes.</p>";
    echo "<script>setTimeout(() => { window.location.href = '../login2.html'; }, 3000);</script>";



} catch (PDOException $e) {
    http_response_code(500);
    echo "<h2>Erro ao ativar conta. Tente novamente mais tarde.</h2>";
    echo "<p>Detalhes técnicos: " . htmlspecialchars($e->getMessage()) . "</p>";
}
