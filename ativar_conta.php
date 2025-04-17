<?php
session_start();
require_once __DIR__ . '/config.php';

// Verifica se o token foi fornecido
if (!isset($_GET['token'])) {
    $_SESSION['error_messages']['general'] = 'Token de ativação inválido.';
    header('Location: ../login2.php');
    exit;
}

if (isset($_GET['token'])) {
    $token = $_GET['token'];

    try {
        $pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Verifica o token
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE token = ? AND ativo = 0");
        $stmt->execute([$token]);
        
        if ($stmt->rowCount() > 0) {
            // Ativa a conta
            $stmt = $pdo->prepare("UPDATE usuarios SET ativo = 1, token = NULL WHERE token = ?");
            $stmt->execute([$token]);
            
            $_SESSION['sucesso'] = "Conta ativada com sucesso! Você já pode fazer login.";
        } else {
            $_SESSION['erro'] = "Token inválido ou conta já ativada.";
        }

    } catch (PDOException $e) {
        error_log("Erro ao ativar conta: " . $e->getMessage(), 3, "php/debug_error.log");
        $_SESSION['erro'] = "Erro ao ativar conta. Tente novamente mais tarde.";
    }
} else {
    $_SESSION['erro'] = "Token não fornecido.";
}

header('Location: cadastro.php');
exit;