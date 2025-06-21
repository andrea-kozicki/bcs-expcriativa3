<?php
session_start();

define('MAX_SESSION_IDLE_TIME', 900);

if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY']) > MAX_SESSION_IDLE_TIME) {
    session_unset();
    session_destroy();
    responder(false, 'Sessão expirada ou inválida.');
}
$_SESSION['LAST_ACTIVITY'] = time();

header('Content-Type: application/json');
require_once 'config.php';

function responder($success, $message) {
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

// ===============================
// 🔐 1. Captura e sanitização dos dados
// ===============================
$email        = $_POST['email'] ?? null;
$senhaAtual   = $_POST['senhaAtual'] ?? null;
$novaSenha    = $_POST['novaSenha'] ?? null;
$token        = $_POST['token'] ?? null;

// ===============================
// 🚫 2. Validação inicial
// ===============================
if (empty($novaSenha)) {
    responder(false, 'Nova senha não fornecida.');
}

$pdo = getDatabaseConnection();

// ===============================
// ✅ 3. FLUXO 1: Usuário logado
// ===============================
if ($senhaAtual !== null) {

    if (!isset($_SESSION['usuario_email'])) {
        responder(false, 'Sessão expirada ou inválida.');
    }

    $email = $_SESSION['usuario_email'];

    $stmt = $pdo->prepare("SELECT senha_modern_hash FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        responder(false, 'Usuário não encontrado.');
    }

    if (!password_verify($senhaAtual, $usuario['senha_modern_hash'])) {
        responder(false, 'Senha atual incorreta.');
    }
}

// ===============================
// ✅ 4. FLUXO 2: Redefinição via token
// ===============================
elseif ($token !== null) {

    if (empty($email)) {
        responder(false, 'Email obrigatório para redefinição por token.');
    }

    $stmt = $pdo->prepare("SELECT * FROM tokens_redefinicao WHERE token = ? AND email = ? AND expiracao > NOW()");
    $stmt->execute([$token, $email]);
    $validacao = $stmt->fetch();

    if (!$validacao) {
        responder(false, 'Token inválido ou expirado.');
    }

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
// 🔄 6. Atualiza a senha no banco
// ===============================
$hashNovo = password_hash($novaSenha, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("UPDATE usuarios SET senha_modern_hash = ? WHERE email = ?");
$sucesso = $stmt->execute([$hashNovo, $email]);

if ($sucesso) {
    responder(true, 'Senha atualizada com sucesso.');
} else {
    responder(false, 'Erro ao atualizar a senha.');
}
