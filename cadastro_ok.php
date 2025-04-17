<?php

/**
 * Página de Cadastro - Livraria Estrela
 * 
 * Seções:
 * 1. Configurações Iniciais e Sessão
 * 2. Cabeçalho HTML e Metadados
 * 3. Barra de Navegação (Navbar)
 * 4. Menu Lateral (Sidebar)
 * 5. Formulário de Cadastro
 * 6. Rodapé e Scripts
 */

// =============================================
// 1. CONFIGURAÇÕES INICIAIS E SESSÃO
// =============================================
require_once 'config.php';

// Inicia sessão
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Valores padrão para os campos
$formData = [
    'name' => '',
    'email' => '',
    'telefone' => '',
    'cpf' => '',
    'data_nascimento' => '',
    'cep' => '',
    'estado' => '',
    'cidade' => '',
    'rua' => '',
    'numero' => ''
];

// Recupera dados do formulário em caso de erro
if (isset($_SESSION['form_data'])) {
    $formData = array_merge($formData, $_SESSION['form_data']);
    unset($_SESSION['form_data']);
}

// Redireciona se não houver mensagem de sucesso
if (!isset($_SESSION['sucesso'])) {
    header('Location: cadastro.php');
    exit;
}

$sucesso = $_SESSION['sucesso'];
unset($_SESSION['sucesso']);

// Mensagens de feedback
$errorMessages = $_SESSION['error_messages'] ?? [];
$successMessage = $_SESSION['success_message'] ?? '';
unset($_SESSION['error_messages'], $_SESSION['success_message']);

// =============================================
// 2. CABEÇALHO HTML E METADADOS
// =============================================
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Cadastro - Livraria Estrela</title>
    <link rel="shortcut icon" href="/imagens/estrela.ico" type="image/x-icon">

    <!-- CSS -->
    <link rel="stylesheet" href="/css/cadastrocss.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">
</head>

<body>

    <!-- ============================================= -->
    <!-- 3. BARRA DE NAVEGAÇÃO (NAVBAR) -->
    <!-- ============================================= -->
    <nav class="navbar">
        <div class="navbar-content">
            <div class="bars"><i class="fa-solid fa-bars fa-xl"></i></div>
            <img src="/imagens/estrela.ico" class="logo" alt="Logo Livraria Estrela">
        </div>

        <div class="navbar-content">
            <div class="avatar">
                <img src="/imagens/user-pic.jpg" alt="Usuário" width="40">
                <div class="dropdown-menu setting">
                    <div class="item"><span class="fa-solid fa-door-open"></span> <a href="/login2.php">Login</a></div>
                    <div class="item"><span class="fa-solid fa-user"></span><a href="/perfil.html">Perfil</a></div>
                    <div class="item"><span class="fa-solid fa-door-open"></span><a href="/index.html">Sair</a></div>
                </div>
            </div>
        </div>
    </nav>

    <!-- ============================================= -->
    <!-- 4. MENU LATERAL (SIDEBAR) -->
    <!-- ============================================= -->
    <div class="content">
        <div class="sidebar active">
            <a href="/index.html" class="sidebar-nav"><i class="icon fa-solid fa-house"></i><span>Inicio</span></a>
            <a href="/maisvendidos.html" class="sidebar-nav"><i class="icon fa-solid fa-medal"></i><span>Mais vendidos</span></a>

            <button class="dropdown-btn sidebar-nav">
                <i class="icon fa-solid fa-book"></i><span>Gêneros</span><i class="fa-solid fa-caret-down"></i>
            </button>

            <div class="dropdown-container">
                <a href="/romance.html" class="sidebar-nav"><i class="icon fa-solid fa-heart"></i><span>Romance</span></a>
                <a href="/biografias.html" class="sidebar-nav"><i class="icon fa-solid fa-pen-nib"></i><span>Biografias</span></a>
                <a href="/poesias.html" class="sidebar-nav"><i class="icon fa-solid fa-feather"></i><span>Poesias</span></a>
                <a href="/contos.html" class="sidebar-nav"><i class="icon fa-solid fa-comment"></i><span>Contos</span></a>
            </div>

            <a href="/contato.html" class="sidebar-nav"><i class="icon fa-solid fa-envelope"></i><span>Contato</span></a>
            <a href="/sobre.html" class="sidebar-nav"><i class="icon fa-solid fa-eye"></i><span>Sobre a livraria</span></a>
        </div>

        <!-- ============================================= -->
        <!-- 5. FORMULÁRIO DE CADASTRO OTIMIZADO -->
        <!-- ============================================= -->
        <div class="wrapper">
            <div class="row">
                <div class="top-list">
                    <span class="title-content">Faça seu cadastro</span>
                </div>

                <!-- Mensagens de Feedback -->
                <?php if (!empty($successMessage)): ?>
                    <div class="popup success show"><?= htmlspecialchars($successMessage) ?></div>
                <?php endif; ?>

                <?php if (!empty($errorMessages['general'])): ?>
                    <div class="popup error show"><?= htmlspecialchars($errorMessages['general']) ?></div>
                <?php endif; ?>

                <!-- Substituir a seção do formulário por: -->
                <div>
                    <span>Seu cadastro foi recebido com sucesso. Acesse seu email para confirmar o seu cadastro.</span>
                    <button class="btn-success"><a href="index.html"></a>Ir para a página inicial</button>

                </div>
                

                <!-- ============================================= -->
                <!-- 6. RODAPÉ E SCRIPTS -->
                <!-- ============================================= -->
                
                <script src="https://cdnjs.cloudflare.com/ajax/libs/imask/6.4.3/imask.min.js"></script>
                
                <script src="/js/sitejs.js"></script>

</body>

</html>