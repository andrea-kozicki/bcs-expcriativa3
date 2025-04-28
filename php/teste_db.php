<?php
require_once __DIR__ . '/../config.php';

try {
    $db = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
    echo "Conexão bem-sucedida!<br>";
    
    $stmt = $db->query("SELECT COUNT(*) FROM usuarios");
    echo "Total de usuários: " . $stmt->fetchColumn();
} catch (PDOException $e) {
    die("ERRO: " . $e->getMessage());
}
?>