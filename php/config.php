<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Carrega .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Define variáveis do ambiente
$db_name   = $_ENV['DB_NAME']   ?? '';
$db_user   = $_ENV['DB_USER']   ?? '';
$db_pass   = $_ENV['DB_PASS']   ?? '';
$db_socket = $_ENV['DB_SOCKET'] ?? '';
$db_host   = $_ENV['DB_HOST']   ?? '127.0.0.1';
$db_port   = $_ENV['DB_PORT']   ?? '3306';

// Define DSN com prioridade para socket
if (!empty($db_socket)) {
    $dsn = "mysql:dbname=$db_name;unix_socket=$db_socket;charset=utf8mb4";
} else {
    $dsn = "mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4";
}

// Cria a conexão global $pdo
try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    die('Erro de conexão com o banco de dados: ' . $e->getMessage());
}

// Cria função compatível para scripts novos
function getDatabaseConnection(): PDO {
    global $pdo;
    return $pdo;
}


