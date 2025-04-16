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
session_start();

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
                <form class="form-adm" action="php/processa_cadastro.php" method="post" id="cadastroForm" novalidate>
                    <!-- Seção Dados Pessoais -->
                    <div class="field-group">
                        <div class="field-group-title">Dados Pessoais</div>

                        <!-- Nome -->
                        <div class="form-row">
                            <div class="form-col full-width">
                                <label class="title-input" for="name">Nome completo</label>
                                <input type="text" name="name" id="name" class="input-adm <?= isset($errorMessages['name']) ? 'error' : '' ?>"
                                    maxlength="100" required value="<?= htmlspecialchars($formData['name']) ?>"
                                    placeholder="Digite seu nome completo">
                                <?php if (isset($errorMessages['name'])): ?>
                                    <span class="error-message"><?= htmlspecialchars($errorMessages['name']) ?></span>
                                <?php endif; ?>
                            </div>
                        </div>

                        <!-- Email -->
                        <div class="form-row">
                            <div class="form-col full-width">
                                <label class="title-input" for="email">Email</label>
                                <input type="email" name="email" id="email" class="input-adm <?= isset($errorMessages['email']) ? 'error' : '' ?>"
                                    maxlength="100" required value="<?= htmlspecialchars($formData['email']) ?>"
                                    placeholder="exemplo@email.com">
                                <?php if (isset($errorMessages['email'])): ?>
                                    <span class="error-message"><?= htmlspecialchars($errorMessages['email']) ?></span>
                                <?php endif; ?>
                            </div>
                        </div>

                        <!-- Telefone e CPF -->
                        <div class="form-row">
                            <div class="form-col">
                                <label class="title-input" for="telefone">Telefone</label>
                                <input class="input-adm <?= isset($errorMessages['telefone']) ? 'error' : '' ?>"
                                    type="tel" id="telefone" name="telefone" maxlength="15" required
                                    value="<?= htmlspecialchars($formData['telefone']) ?>"
                                    placeholder="(00) 00000-0000">
                                <?php if (isset($errorMessages['telefone'])): ?>
                                    <span class="error-message"><?= htmlspecialchars($errorMessages['telefone']) ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-col">
                                <label class="title-input" for="cpf">CPF</label>
                                <input class="input-adm <?= isset($errorMessages['cpf']) ? 'error' : '' ?>"
                                    type="text" id="cpf" name="cpf" maxlength="14" required
                                    value="<?= htmlspecialchars($formData['cpf']) ?>"
                                    placeholder="000.000.000-00">
                                <?php if (isset($errorMessages['cpf'])): ?>
                                    <span class="error-message"><?= htmlspecialchars($errorMessages['cpf']) ?></span>
                                <?php endif; ?>
                            </div>
                        </div>

                        <!-- Senha e Data Nascimento -->
                        <div class="form-row">
                            <div class="form-col">
                                <label class="title-input" for="senha">Senha (12-20 caracteres)</label>
                                <div class="password-container">
                                    <input class="input-adm <?= isset($errorMessages['senha']) ? 'error' : '' ?>"
                                        type="password" id="senha" name="senha" maxlength="20" minlength="12" required
                                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,20}$" placeholder="Mínimo 12 caracteres">
                                    
                                    <button type="button" class="toggle-password" aria-label="Mostrar senha">
                                        <i class="fa fa-eye"></i>
                                    </button>
                                </div>
                                <div class="password-strength-container">
                                    <small class="password-strength-text">
                                        Força: <span class="strength-level">Nenhuma</span>
                                    </small>
                                    <div class="password-strength-meter">
                                        <div class="password-strength-bar"></div>
                                    </div>
                                </div>

                                <?php if (isset($errorMessages['senha'])): ?>
                                    <span class="error-message"><?= htmlspecialchars($errorMessages['senha']) ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-col">
                                <label class="title-input" for="data_nascimento">Nascimento</label>
                                <input class="input-adm <?= isset($errorMessages['data_nascimento']) ? 'error' : '' ?>"
                                    type="text" id="data_nascimento" name="data_nascimento" maxlength="10" required
                                    value="<?= htmlspecialchars($formData['data_nascimento']) ?>"
                                    placeholder="dd/mm/aaaa">
                                <?php if (isset($errorMessages['data_nascimento'])): ?>
                                    <span class="error-message"><?= htmlspecialchars($errorMessages['data_nascimento']) ?></span>
                                <?php endif; ?>
                            </div>
                        </div>

                        <!-- Seção Endereço -->
                        <div class="field-group">
                            <div class="field-group-title">Endereço</div>

                            <!-- CEP e Estado -->
                            <div class="form-row">
                                <div class="form-col">
                                    <label class="title-input" for="cep">CEP</label>
                                    <input class="input-adm <?= isset($errorMessages['cep']) ? 'error' : '' ?>"
                                        type="text" id="cep" name="cep" maxlength="9" required
                                        value="<?= htmlspecialchars($formData['cep']) ?>">
                                    <?php if (isset($errorMessages['cep'])): ?>
                                        <span class="error-message"><?= htmlspecialchars($errorMessages['cep']) ?></span>
                                    <?php endif; ?>
                                </div>

                                <div class="form-col">
                                    <label class="title-input" for="estado">Estado</label>
                                    <select class="input-adm <?= isset($errorMessages['estado']) ? 'error' : '' ?>"
                                        id="estado" name="estado" required>
                                        <option value="">Selecione...</option>
                                        <?php foreach ($estados as $sigla): ?>
                                            <option value="<?= $sigla ?>" <?= ($formData['estado'] == $sigla) ? 'selected' : '' ?>>
                                                <?= $sigla ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                    <?php if (isset($errorMessages['estado'])): ?>
                                        <span class="error-message"><?= htmlspecialchars($errorMessages['estado']) ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <!-- Cidade -->
                            <div class="form-row">
                                <div class="form-col full-width">
                                    <label class="title-input" for="cidade">Cidade</label>
                                    <input class="input-adm <?= isset($errorMessages['cidade']) ? 'error' : '' ?>"
                                        type="text" id="cidade" name="cidade" maxlength="50" required
                                        value="<?= htmlspecialchars($formData['cidade']) ?>">
                                    <?php if (isset($errorMessages['cidade'])): ?>
                                        <span class="error-message"><?= htmlspecialchars($errorMessages['cidade']) ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <!-- Rua e Número -->
                            <div class="form-row">
                                <div class="form-col large">
                                    <label class="title-input" for="rua">Rua</label>
                                    <input class="input-adm <?= isset($errorMessages['rua']) ? 'error' : '' ?>"
                                        type="text" id="rua" name="rua" maxlength="100" required
                                        value="<?= htmlspecialchars($formData['rua']) ?>">
                                    <?php if (isset($errorMessages['rua'])): ?>
                                        <span class="error-message"><?= htmlspecialchars($errorMessages['rua']) ?></span>
                                    <?php endif; ?>
                                </div>

                                <div class="form-col small">
                                    <label class="title-input" for="numero">Número</label>
                                    <input class="input-adm <?= isset($errorMessages['numero']) ? 'error' : '' ?>"
                                        type="text" id="numero" name="numero" maxlength="10" required
                                        value="<?= htmlspecialchars($formData['numero']) ?>">
                                    <?php if (isset($errorMessages['numero'])): ?>
                                        <span class="error-message"><?= htmlspecialchars($errorMessages['numero']) ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="senha_hash" name="senha_hash">
                        <button type="submit" class="btn-success" id="submitBtn">
                            <span id="submitText">Cadastrar</span>
                        </button>
                </form>

                <!-- ============================================= -->
                <!-- 6. RODAPÉ E SCRIPTS -->
                <!-- ============================================= -->
                <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/imask/6.4.3/imask.min.js"></script>
                <script src="/js/cadastrojs.js"></script>
                <script src="/js/sitejs.js"></script>

</body>

</html>