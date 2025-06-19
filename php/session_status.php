<?php
// SEGURANÇA DE COOKIES
ini_set('session.name', 'PHPSESSID');
ini_set('session.cookie_path', '/');
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_secure', 0); // Mude para 1 se usar HTTPS

// INICIALIZAÇÃO
session_start();
header('Content-Type: application/json');
require_once 'config.php';

define('MAX_SESSION_IDLE_TIME', 300); // 5 minutos

// EXPIRAÇÃO DE SESSÃO
if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY']) > MAX_SESSION_IDLE_TIME) {
    session_unset();
    session_destroy();
    echo json_encode([
        'logged_in' => false,
        'message' => 'Sessão expirada por inatividade.'
    ]);
    exit;
}

// ATUALIZA TEMPO DE ATIVIDADE
$_SESSION['LAST_ACTIVITY'] = time();

// TOKEN CSRF
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// RESPOSTA COM SESSÃO ATIVA
if (!empty($_SESSION['usuario_id'])) {
    try {
        $pdo = getDatabaseConnection();
        $stmt = $pdo->prepare("SELECT mfa_enabled FROM usuarios WHERE id = ?");
        $stmt->execute([$_SESSION['usuario_id']]);
        $mfa_enabled = (int) $stmt->fetchColumn();
    } catch (Exception $e) {
        $mfa_enabled = 0;
    }

    echo json_encode([
        'logged_in'    => true,
        'usuario_id'   => $_SESSION['usuario_id'],
        'email'        => $_SESSION['usuario_email'] ?? null,
        'nome'         => $_SESSION['usuario_nome'] ?? '',
        'csrf_token'   => $_SESSION['csrf_token'],
        'mfa_enabled'  => $mfa_enabled
    ]);
    exit;
}

// RESPOSTA SEM SESSÃO ATIVA
echo json_encode([
    'logged_in'  => false,
    'csrf_token' => $_SESSION['csrf_token']
]);
