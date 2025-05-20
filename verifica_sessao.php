<?php
session_start();

// Tempo de inatividade permitido (em segundos)
$tempoInatividade = 600; // 10 minutos

// Verifica tempo de inatividade
if (isset($_SESSION['ultimo_acesso'])) {
    $tempoAtual = time();
    $tempoInativo = $tempoAtual - $_SESSION['ultimo_acesso'];

    if ($tempoInativo > $tempoInatividade) {
        session_unset();
        session_destroy();
        header("Location: /login.html?expirado=1");
        exit;
    }
}

// Verifica se o usuário está logado
if (!isset($_SESSION['usuario_id'])) {
    header("Location: /login.html");
    exit;
}

// Atualiza o tempo de último acesso
$_SESSION['ultimo_acesso'] = time();
