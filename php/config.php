<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Carrega o .env ANTES de usar getenv()
$dotenv = Dotenv::createImmutable(dirname(__DIR__));
$dotenv->load();

function conectar() {
    $dbname = $_ENV['DB_NAME'] ?? null;
    $user = $_ENV['DB_USER'] ?? null;
    $pass = $_ENV['DB_PASS'] ?? null;
    $socket = $_ENV['DB_SOCKET'] ?? null;


    // DEBUG opcional
    // var_dump($socket, $dbname, $user, $pass);

    if (!$socket || !$dbname || !$user) {
        die("❌ Erro: variáveis de ambiente não carregadas corretamente.");
    }

    $dsn = "mysql:unix_socket=$socket;dbname=$dbname;charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        die("Erro de conexão: " . $e->getMessage());
    }
}
