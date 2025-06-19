<?php
session_start();


define('MAX_SESSION_IDLE_TIME', 900); // Igual ao session_status.php

if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY']) > MAX_SESSION_IDLE_TIME) {
    session_unset();
    session_destroy();
    responder(false, 'Sessão expirada ou inválida.');
}

$_SESSION['LAST_ACTIVITY'] = time(); // 🔄 Renova a sessão

header('Content-Type: application/json');

// Função para responder e encerrar
function responder($success, $message) {
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

// Requer conexão
require_once 'config.php';

// ===============================
// 🔐 1. Captura e sanitização dos dados
// ===============================
$email       = $_POST['email'] ?? null;
$senha_hash  = $_POST['senha_hash'] ?? '';
$salt        = $_POST['salt'] ?? '';
$senhaAtual  = $_POST['senhaAtual'] ?? null;
$token       = $_POST['token'] ?? null;

// ===============================
// 🚫 2. Validação inicial
// ===============================
if (empty($senha_hash) || empty($salt)) {
    responder(false, 'Dados de senha ausentes.');
}

// ===============================
// ✅ 3. FLUXO 1: Usuário logado (alteração pelo perfil)
// ===============================
if ($senhaAtual !== null) {

    if (!isset($_SESSION['usuario_email'])) {
    responder(false, 'Sessão expirada ou inválida.');
}

    $email = $_SESSION['usuario_email'];

    // Buscar dados do usuário
    $stmt = $pdo->prepare("SELECT senha_hash, salt FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        responder(false, 'Usuário não encontrado.');
    }

    // Verificar senha atual
    $hashVerificado = hash('sha256', $senhaAtual . $usuario['salt']);
    if ($hashVerificado !== $usuario['senha_hash']) {
        responder(false, 'Senha atual incorreta.');
    }

}

// ===============================
// ✅ 4. FLUXO 2: Redefinição via e-mail (sem login)
// ===============================
elseif ($token !== null) {

    if (empty($email)) {
        responder(false, 'Email obrigatório para redefinição por token.');
    }

    // Verificar se token é válido
    $stmt = $pdo->prepare("SELECT * FROM tokens_redefinicao WHERE token = ? AND email = ? AND expiracao > NOW()");
    $stmt->execute([$token, $email]);
    $validacao = $stmt->fetch();

    if (!$validacao) {
        responder(false, 'Token inválido ou expirado.');
    }

    // Invalida o token após uso
    $stmt = $pdo->prepare("DELETE FROM tokens_redefinicao WHERE token = ?");
    $stmt->execute([$token]);

}

// ===============================
// ❌ 5. Caso inválido
// ===============================
else {
    responder(false, 'Requisição inválida. Use senha atual ou token de redefinição.');
}

// ===============================
// 🔄 6. Atualizar a senha no banco
// ===============================
$stmt = $pdo->prepare("UPDATE usuarios SET senha_hash = ?, salt = ? WHERE email = ?");
$sucesso = $stmt->execute([$senha_hash, $salt, $email]);

if ($sucesso) {
    responder(true, 'Senha atualizada com sucesso.');
} else {
    responder(false, 'Erro ao atualizar a senha.');
}
