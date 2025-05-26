<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

require_once 'config.php'; // Garante que $conn (PDO) está disponível
header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id']) || empty($_SESSION['usuario_email'])) {
    http_response_code(403);
    echo json_encode(['erro' => 'Acesso negado. Sessão expirada ou não autenticada.']);
    exit();
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    exit();
}

// Coleta e valida campos obrigatórios
$email = $_POST['email'] ?? '';
$senhaHash = $_POST['senha_hash'] ?? '';
$salt = $_POST['salt'] ?? '';

if (empty($email) || empty($senhaHash) || empty($salt)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios.']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Formato de e-mail inválido.']);
    exit();
}

try {
    $conn = getDatabaseConnection();
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = :email");
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'E-mail não encontrado.']);
        exit();
    }

    // Atualiza hash e salt
    $update = $conn->prepare("UPDATE usuarios SET senha_hash = :senha_hash, salt = :salt WHERE email = :email");
    $update->bindParam(':senha_hash', $senhaHash);
    $update->bindParam(':salt', $salt);
    $update->bindParam(':email', $email);

    if ($update->execute()) {
        echo json_encode(['success' => true, 'message' => 'Senha atualizada com sucesso!']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro ao atualizar a senha.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no banco de dados: ' . $e->getMessage()]);
}
