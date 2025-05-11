<?php
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

function getDatabaseConnection() {
    $dsn = "mysql:host={$_ENV['DB_HOST']};dbname={$_ENV['DB_NAME']};charset=utf8mb4";
    return new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
}

try {
    if (!isset($_GET['token'])) {
        throw new Exception("Token de ativação não informado.");
    }

    $token = $_GET['token'];
    $pdo = getDatabaseConnection();

    // Verifica se token é válido e não ativado
    $stmt = $pdo->prepare("SELECT id, ativado FROM usuarios WHERE token_ativacao = ?");
    $stmt->execute([$token]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        throw new Exception("Token inválido ou expirado.");
    }

    if ($usuario['ativado']) {
        echo "<h2>Conta já foi ativada anteriormente.</h2>";
    } else {
        $update = $pdo->prepare("UPDATE usuarios SET ativado = 1, token_ativacao = NULL WHERE id = ?");
        $update->execute([$usuario['id']]);
        echo "<h2>Conta ativada com sucesso! Você já pode fazer login.</h2>";
    }
} catch (Exception $e) {
    echo "<h3>Erro ao ativar conta: " . htmlspecialchars($e->getMessage()) . "</h3>";
}
