<?php
// Inicia a sessão para mensagens de feedback
session_start();

// Define variáveis padrão para os campos do formulário
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

// Se houver dados submetidos anteriormente (em caso de erro), preenche os campos
if (isset($_SESSION['form_data'])) {
    $formData = array_merge($formData, $_SESSION['form_data']);
    unset($_SESSION['form_data']);
}

// Verifica se há mensagens de erro para exibir
$errorMessages = [];
if (isset($_SESSION['error_messages'])) {
    $errorMessages = $_SESSION['error_messages'];
    unset($_SESSION['error_messages']);
}

// Verifica se há mensagem de sucesso
$successMessage = '';
if (isset($_SESSION['success_message'])) {
    $successMessage = $_SESSION['success_message'];
    unset($_SESSION['success_message']);
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="/imagens/estrela.ico" type="image/x-icon">
    <link rel="stylesheet" href="/css/cadastrocss.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/imask/6.4.3/imask.min.js"></script>
    <title>Cadastro</title>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <div class="bars">
                <i class="fa-solid fa-bars fa-xl"></i>
            </div>
            <img src="/imagens/estrela.ico" class="logo"/>
        </div>
             
        <div class="navbar-content">                
            <div class="avatar">
                <img src="/imagens/user-pic.jpg" alt="usuario" width="40">
                <div class="dropdown-menu setting">
                    <div class="item">
                        <span class="fa-solid fa-door-open"></span> <a href="/login2.php">Login</a> 
                    </div>
                    <div class="item">
                        <span class="fa-solid fa-user"></span><a href="/perfil.html">Perfil</a>
                    </div>
                    <div class="item">
                        <span class="fa-solid fa-door-open"></span><a href="/index.html">Sair</a>
                    </div>
                </div>
            </div>    
        </div>
    </nav>

    <div class="content">
        <div class="sidebar active">
            <a href="/index.html" class="sidebar-nav"> <i class="icon fa-solid fa-house"></i><span>Inicio</span></a>
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
            <a href="/contato.html" class="sidebar-nav"> <i class="icon fa-solid fa-envelope"></i><span>Contato</span></a>
            <a href="/sobre.html" class="sidebar-nav"> <i class="icon fa-solid fa-eye"></i><span>Sobre a livraria</span></a>
        </div>

        <div class="wrapper">
            <div class="row">
                <div class="top-list">
                    <span class="title-content">Faça o seu cadastro com a gente! :)</span>
                </div>
                
                <!-- Exibe mensagem de sucesso -->
                <?php if (!empty($successMessage)): ?>
                    <div class="popup success show">
                        <?php echo htmlspecialchars($successMessage); ?>
                    </div>
                <?php endif; ?>
                
                <!-- Exibe mensagens de erro gerais -->
                <?php if (!empty($errorMessages['general'])): ?>
                    <div class="popup error show">
                        <?php echo htmlspecialchars($errorMessages['general']); ?>
                    </div>
                <?php endif; ?>
                
                <div class="content-adm">
                    <form class="form-adm" action="php/processa_cadastro.php" method="post" id="cadastroForm" novalidate>
                        <!-- Dados Pessoais -->
                        <div class="field-group">
                            <div class="field-group-title">Dados Pessoais</div>
                            
                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="name">Nome</label>
                                    <input type="text" name="name" id="name" class="input-adm <?php echo isset($errorMessages['name']) ? 'error' : ''; ?>" 
                                           placeholder="Nome completo" required value="<?php echo htmlspecialchars($formData['name']); ?>">
                                    <?php if (isset($errorMessages['name'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['name']); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="email">Email</label>
                                    <input type="email" name="email" id="email" class="input-adm <?php echo isset($errorMessages['email']) ? 'error' : ''; ?>" 
                                           placeholder="Melhor email" required value="<?php echo htmlspecialchars($formData['email']); ?>">
                                    <?php if (isset($errorMessages['email'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['email']); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>    

                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="senha">Senha:</label>
                                    <div class="password-container"> <!-- Novo container para o campo de senha -->
                                        <input class="input-adm <?php echo isset($errorMessages['senha']) ? 'error' : ''; ?>" 
                                            type="password" id="senha" name="senha" 
                                            required pattern="^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{12,}$"
                                            title="A senha deve conter no mínimo 12 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.">
                                        <span class="toggle-password"><i class="fa fa-eye"></i></span>
                                    </div>

                                    <div class="password-strength-container"> <!-- Container para o indicador de força -->
                                        <small class="password-strength-text">Força da senha: <span class="strength-level">Nenhuma</span></small>
                                        <div class="password-strength-meter">
                                            <div class="password-strength-bar"></div>
                                        </div>
                                    </div>

                                    <?php if (isset($errorMessages['senha'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['senha']); ?></span>
                                    <?php endif; ?>
                                    <input type="hidden" id="senha_hash" name="senha_hash">
                                </div>
                            </div>
                            
                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="telefone">Telefone:</label>
                                    <input class="input-adm <?php echo isset($errorMessages['telefone']) ? 'error' : ''; ?>" type="tel" id="telefone" name="telefone" 
                                           placeholder="(00) 00000-0000" required value="<?php echo htmlspecialchars($formData['telefone']); ?>">
                                    <?php if (isset($errorMessages['telefone'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['telefone']); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="cpf">CPF:</label>
                                    <input class="input-adm <?php echo isset($errorMessages['cpf']) ? 'error' : ''; ?>" type="text" id="cpf" name="cpf" 
                                           placeholder="000.000.000-00" required value="<?php echo htmlspecialchars($formData['cpf']); ?>">
                                    <?php if (isset($errorMessages['cpf'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['cpf']); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>

                           
                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="data_nascimento">Data de Nascimento:</label>
                                    <input class="input-adm <?php echo isset($errorMessages['data_nascimento']) ? 'error' : ''; ?>" 
                                        type="text" id="data_nascimento" name="data_nascimento" 
                                        placeholder="dd/mm/aaaa" required 
                                        value="<?php echo htmlspecialchars($formData['data_nascimento']); ?>">
                                    <?php if (isset($errorMessages['data_nascimento'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['data_nascimento']); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>

<!-- ... (restante do código mantido) ... -->
                        </div>

                        <!-- Endereço -->
                        <div class="field-group">
                            <div class="field-group-title">Endereço</div>
                            
                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="cep">CEP:</label>
                                    <input class="input-adm <?php echo isset($errorMessages['cep']) ? 'error' : ''; ?>" type="text" id="cep" name="cep" 
                                           placeholder="00000-000" required value="<?php echo htmlspecialchars($formData['cep']); ?>">
                                    <?php if (isset($errorMessages['cep'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['cep']); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="estado">Estado:</label>
                                    <select class="input-adm <?php echo isset($errorMessages['estado']) ? 'error' : ''; ?>" id="estado" name="estado" required>
                                        <option value="">Selecione...</option>
                                    
                                        <option value="AC" <?php echo ($formData['estado'] == 'AC') ? 'selected' : ''; ?>>Acre</option>
                                        <option value="AL" <?php echo ($formData['estado'] == 'AL') ? 'selected' : ''; ?>>Alagoas</option>
                                        <option value="AP" <?php echo ($formData['estado'] == 'AP') ? 'selected' : ''; ?>>Amapá</option>
                                        <option value="AM" <?php echo ($formData['estado'] == 'AM') ? 'selected' : ''; ?>>Amazonas</option>
                                        <option value="BA" <?php echo ($formData['estado'] == 'BA') ? 'selected' : ''; ?>>Bahia</option>
                                        <option value="CE" <?php echo ($formData['estado'] == 'CE') ? 'selected' : ''; ?>>Ceará</option>
                                        <option value="DF" <?php echo ($formData['estado'] == 'DF') ? 'selected' : ''; ?>>Distrito Federal</option>
                                        <option value="ES" <?php echo ($formData['estado'] == 'ES') ? 'selected' : ''; ?>>Espírito Santo</option>
                                        <option value="GO" <?php echo ($formData['estado'] == 'GO') ? 'selected' : ''; ?>>Goiás</option>
                                        <option value="MA" <?php echo ($formData['estado'] == 'MA') ? 'selected' : ''; ?>>Maranhão</option>
                                        <option value="MT" <?php echo ($formData['estado'] == 'MT') ? 'selected' : ''; ?>>Mato Grosso</option>
                                        <option value="MS" <?php echo ($formData['estado'] == 'MS') ? 'selected' : ''; ?>>Mato Grosso do Sul</option>
                                        <option value="MG" <?php echo ($formData['estado'] == 'MG') ? 'selected' : ''; ?>>Minas Gerais</option>
                                        <option value="PA" <?php echo ($formData['estado'] == 'PA') ? 'selected' : ''; ?>>Pará</option>
                                        <option value="PB" <?php echo ($formData['estado'] == 'PB') ? 'selected' : ''; ?>>Paraíba</option>
                                        <option value="PR" <?php echo ($formData['estado'] == 'PR') ? 'selected' : ''; ?>>Paraná</option>
                                        <option value="PE" <?php echo ($formData['estado'] == 'PE') ? 'selected' : ''; ?>>Pernambuco</option>
                                        <option value="PI" <?php echo ($formData['estado'] == 'PI') ? 'selected' : ''; ?>>Piauí</option>
                                        <option value="RJ" <?php echo ($formData['estado'] == 'RJ') ? 'selected' : ''; ?>>Rio de Janeiro</option>
                                        <option value="RN" <?php echo ($formData['estado'] == 'RN') ? 'selected' : ''; ?>>Rio Grande do Norte</option>
                                        <option value="RS" <?php echo ($formData['estado'] == 'RS') ? 'selected' : ''; ?>>Rio Grande do Sul</option>
                                        <option value="RO" <?php echo ($formData['estado'] == 'RO') ? 'selected' : ''; ?>>Rondônia</option>
                                        <option value="RR" <?php echo ($formData['estado'] == 'RR') ? 'selected' : ''; ?>>Roraima</option>
                                        <option value="SC" <?php echo ($formData['estado'] == 'SC') ? 'selected' : ''; ?>>Santa Catarina</option>
                                        <option value="SP" <?php echo ($formData['estado'] == 'SP') ? 'selected' : ''; ?>>São Paulo</option>
                                        <option value="SE" <?php echo ($formData['estado'] == 'SE') ? 'selected' : ''; ?>>Sergipe</option>
                                        <option value="TO" <?php echo ($formData['estado'] == 'TO') ? 'selected' : ''; ?>>Tocantins</option>



                                    </select>
                                    <?php if (isset($errorMessages['estado'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['estado']); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="cidade">Cidade:</label>
                                    <input class="input-adm <?php echo isset($errorMessages['cidade']) ? 'error' : ''; ?>" type="text" id="cidade" name="cidade" 
                                           required value="<?php echo htmlspecialchars($formData['cidade']); ?>">
                                    <?php if (isset($errorMessages['cidade'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['cidade']); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="rua">Rua:</label>
                                    <input class="input-adm <?php echo isset($errorMessages['rua']) ? 'error' : ''; ?>" type="text" id="rua" name="rua" 
                                           required value="<?php echo htmlspecialchars($formData['rua']); ?>">
                                    <?php if (isset($errorMessages['rua'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['rua']); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <div class="row-input">
                                <div class="column">
                                    <label class="title-input" for="numero">Número:</label>
                                    <input class="input-adm <?php echo isset($errorMessages['numero']) ? 'error' : ''; ?>" type="text" id="numero" name="numero" 
                                           required value="<?php echo htmlspecialchars($formData['numero']); ?>">
                                    <?php if (isset($errorMessages['numero'])): ?>
                                        <span class="error-message"><?php echo htmlspecialchars($errorMessages['numero']); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="btn-success" id="submitBtn">
                            <span id="submitText">Enviar</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="/js/cadastrojs.js"></script>
    <script src="/js/sitejs.js"></script>
    
    <script>
        // Aplica máscaras aos campos
        document.addEventListener('DOMContentLoaded', function() {
            // Máscara para CPF
            IMask(document.getElementById('cpf'), {
                mask: '000.000.000-00'
            });
            
            // Máscara para telefone
            IMask(document.getElementById('telefone'), {
                mask: [
                    { mask: '(00) 0000-0000' },
                    { mask: '(00) 00000-0000' }
                ]
            });
            
            // Máscara para CEP
            IMask(document.getElementById('cep'), {
                mask: '00000-000'
            });
            
            // Preenchimento automático do endereço via CEP
            document.getElementById('cep').addEventListener('blur', function() {
                const cep = this.value.replace(/\D/g, '');
                if (cep.length === 8) {
                    fetch(`https://viacep.com.br/ws/${cep}/json/`)
                        .then(response => response.json())
                        .then(data => {
                            if (!data.erro) {
                                document.getElementById('rua').value = data.logradouro || '';
                                document.getElementById('cidade').value = data.localidade || '';
                                document.getElementById('estado').value = data.uf || '';
                                document.getElementById('numero').focus();
                            }
                        })
                        .catch(error => console.error('Erro ao buscar CEP:', error));
                }
            });
        });
    </script>
</body>
</html>