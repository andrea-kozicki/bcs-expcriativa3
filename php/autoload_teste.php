<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

echo "<p>Classe Dotenv carregada com sucesso!</p>";

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

echo "<p>Variável DB_NAME: " . getenv('DB_NAME') . "</p>";
