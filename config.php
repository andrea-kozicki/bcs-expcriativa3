<?php
// Dados da conexão
$servidor = "localhost";
$usuario = "andrea";
$senha = "v%PtYW5o9@y@c";
$dbname = "testelogin";

// Criar conexão
$conn = mysqli_connect($servidor, $usuario, $senha, $dbname);

// Verificar conexão
if (!$conn) {
    // Você pode usar apenas die para erro simples
    die("Falha na conexão: " . mysqli_connect_error());
}

// Definir o charset para UTF-8
if (!mysqli_set_charset($conn, "utf8")) {
    die("Erro ao definir charset UTF-8: " . mysqli_error($conn));
}
?>
