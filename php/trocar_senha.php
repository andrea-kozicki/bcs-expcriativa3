<?php
session_start();
require_once 'config.php'; // Inclui conexão PDO com $conn

// Verifica se os dados foram enviados corretamente
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = $_POST["email"] ?? '';
    $novaSenha = $_POST["novaSenha"] ?? '';
    $confirmarSenha = $_POST["confirmarSenha"] ?? '';

    // Validação básica
    if (empty($email) || empty($novaSenha) || empty($confirmarSenha)) {
        $_SESSION['mensagem'] = "Todos os campos são obrigatórios.";
        header("Location: novasenha.html");
        exit();
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $_SESSION['mensagem'] = "Formato de e-mail inválido.";
        header("Location: novasenha.html");
        exit();
    }

    if ($novaSenha !== $confirmarSenha) {
        $_SESSION['mensagem'] = "As senhas não coincidem.";
        header("Location: /novasenha.html");
        exit();
    }

    try {
        // Verifica se o e-mail existe
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            $_SESSION['mensagem'] = "E-mail não encontrado.";
            header("Location: /novasenha.html");
            exit();
        }

        // Atualiza a senha com hash seguro
        $senhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);
        $update = $conn->prepare("UPDATE usuarios SET senha = :senha WHERE email = :email");
        $update->bindParam(':senha', $senhaHash);
        $update->bindParam(':email', $email);

        if ($update->execute()) {
            $_SESSION['mensagem'] = "Senha atualizada com sucesso!";
            header("Location: /login2.html");
            exit();
        } else {
            $_SESSION['mensagem'] = "Erro ao atualizar a senha.";
            header("Location: /novasenha.html");
            exit();
        }
    } catch (PDOException $e) {
        $_SESSION['mensagem'] = "Erro: " . $e->getMessage();
        header("Location: /novasenha.html");
        exit();
    }
} else {
    header("Location: /novasenha.html");
    exit();
}
