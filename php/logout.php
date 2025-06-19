<?php
session_start();

// Permite apenas requisições POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode([
        "success" => false,
        "message" => "Método não permitido"
    ]);
    exit;
}

session_unset();
session_destroy();

http_response_code(200);
echo json_encode([
    "success" => true,
    "message" => "Logout realizado com sucesso"
]);

