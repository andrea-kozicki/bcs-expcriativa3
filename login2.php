<?php
session_start();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login com Autenticação em Dois Fatores</title>
    
    <!-- Meta Tags e Links -->
    <link rel="shortcut icon" href="./imagens/estrela.ico" type="image/x-icon">
    <link rel="stylesheet" href="./css/sitecss.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;700&display=swap" rel="stylesheet">
    <meta name="csrf-token" content="<?php echo $_SESSION['csrf_token']; ?>">
    <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token'] ?? ''); ?>">
</head>
<body>
    <!-- Barra de Navegação -->
    <nav class="navbar">
        <div class="navbar-content">
            <div class="bars">
                <i class="fa-solid fa-bars fa-xl"></i>
            </div>
            <img src="./imagens/estrela.ico" class="logo"/>
        </div>

       <!--Menu da barra de navegação superior-->
        <div class="navbar-content">                
            <div class="avatar">
                <img src="./imagens/user-pic.jpg" alt="usuario" width="40" >
                <div class="dropdown-menu setting">
                    <div class="item">
                        <span class="fa-solid fa-door-open"></span> <a href="./login.html">Login</a> 
                    </div>
                    <div class="item">
                        <span class="fa-solid fa-user"></span><a href="./perfil.html">Perfil</a>
                    </div>
                    <div class="item">
                        <span class="fa-solid fa-door-open"></span><a href="./index.html">Sair</a>
                    </div>
                </div>
            </div>    
        </div>
    </nav>

    <!--Menu da barra de navegação lateral-->
    <div class="content">
        <div class="sidebar">
            <!-- Itens da sidebar -->
            <a href="./index.html" class="sidebar-nav"> <i class="icon fa-solid fa-house"></i><span>Inicio</span></a>

            <a href="./maisvendidos.html" class="sidebar-nav"><i class="icon fa-solid fa-medal"></i><span>Mais vendidos</span></a>

            <button class="dropdown-btn">
                <i class="icon fa-solid fa-book"></i>
                <span>Gêneros</span>
                <i class="fa-solid fa-caret-down dropdown-arrow"></i>
            </button>

            <div class="dropdown-container">
                <a href="./romance.html" class="sidebar-nav"><i class="icon fa-solid fa-heart"></i><span>Romance</span></a>
                <a href="./biografias.html" class="sidebar-nav"><i class="icon fa-solid fa-pen-nib"></i><span>Biografias</span></a>
                <a href="./poesias.html" class="sidebar-nav"><i class="icon fa-solid fa-feather"></i><span>Poesias</span></a>
                <a href="./contos.html" class="sidebar-nav"><i class="icon fa-solid fa-comment"></i><span>Contos</span></a>
            </div>

            <a href="./contato.html" class="sidebar-nav"> <i class="icon fa-solid fa-envelope"></i><span>Contato</span></a>

            <a href="./sobre.html" class="sidebar-nav"> <i class="icon fa-solid fa-eye"></i><span>Sobre a livraria</span></a>
        </div>

        <!-- Fim da Sidebar -->

        <!-- Inicio do conteudo principal da área de login -->
        <div class="wrapper">
            <div class="row">
                <div class="top-list">
                    <span class="title-content">Faça o seu login</span>
                </div>

                 <!-- Formulário de Login Principal -->
                <div id="basiclogin" class="content-adm">
                    <form id="formlogin" method="post" class="form-adm" onsubmit="event.preventDefault(); handleLogin();">
                        <div class="row-input">
                            <div class="column">
                                <label class="title-input">Email</label>
                                <input type="email" name="email" id="email" class="input-adm" placeholder="Digite o seu email" required>
                            </div>
                        </div>
                        <div class="row-input">
                            <div class="column">
                                <label class="title-input">Senha</label>
                                <input type="password" name="senha" id="senha" class="input-adm" placeholder="Digite sua senha" minlength="12" maxlength="64" required>
                            </div>
                        </div>
                        <br>
                        <button type="submit" class="btn-success" id="entrar">Entrar</button>
                        <button type="button" class="btn-success"> <a href="./redefinesenha.html">Esqueci minha senha</a></button>
                        <button type="button" class="btn-success"> <a href="./cadastro.html">Cadastre-se</a></button>
                    </form>
                    
                </div>
                
                <!-- Espaço do MFA -->
                <div class="mfa-options">
                    <!-- Status do MFA -->
                    <div id="mfaStatus">
                        <span>Autenticação em Dois Fatores: <strong>Desativada</strong></span>
                    </div>

                     <!-- Botão para Ativar MFA -->
                    <button id="enableMfaBtn" class="btn-info" style="margin-bottom: 15px;">
                        <i class="fas fa-shield-alt"></i> Ativar Autenticação em Dois Fatores
                    </button>

                    <!-- Seção de Configuração do MFA -->
                    <div id="mfa-setup" class="mfa-section">
                        <div class="mfa-header">
                            <h3><i class="fas fa-mobile-alt"></i> Configurar Autenticação em Dois Fatores</h3>
                        </div>
                        
                        <div class="mfa-steps">
                            <div class="step">
                                <span class="step-number">1</span>
                                <p>Instale o Google Authenticator no seu celular</p>
                            </div>
                            
                            <div class="step">
                                <span class="step-number">2</span>
                                <p>Escaneie este QR Code com o aplicativo:</p>
                                <div class="qrcode-container">
                                    <img id="mfa-qrcode" src="" alt="QR Code" class="qrcode">
                                </div>
                                <p class="manual-secret">
                                    Ou insira manualmente: <code id="mfa-secret"></code>
                                </p>
                            </div>
                            
                            <div class="step">
                                <span class="step-number">3</span>
                                <p>Digite o código de 6 dígitos gerado pelo aplicativo:</p>
                                <div class="input-group">
                                    <input type="text" id="mfa-setup-code" 
                                        placeholder="000000" maxlength="6" pattern="\d{6}" class="input-adm">
                                    <button id="confirm-mfa-setup" class="btn-primary">
                                        <i class="fas fa-check"></i> Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Seção de Verificação do MFA -->
                    <div id="mfa-verification" class="mfa-section">
                        <div class="mfa-verify">
                            <h3><i class="fas fa-shield-alt"></i> Verificação em Dois Fatores</h3>
                            <p>Digite o código do seu aplicativo autenticador:</p>
                            
                            <div class="input-group">
                                <input type="text" id="mfa-code" 
                                    placeholder="000000" maxlength="6" pattern="\d{6}" class="input-adm">
                                <button id="verify-mfa" class="btn-primary">
                                    <i class="fas fa-sign-in-alt"></i> Verificar
                                </button>
                            </div>
                            
                            <div class="mfa-meta">
                                <p id="tentativas-restantes" class="attempts">
                                    Tentativas restantes: 3
                                </p>
                                <p class="timeout" id="mfa-timeout"></p>
                            </div>
                        </div>
                    </div>
                </div>   
            </div>
        </div>
    </div>
    
    <script src="./js/loginjs.js"></script>
</body>
</html>