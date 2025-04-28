<?php
// Iniciar a sessão para armazenar mensagens (opcional)
session_start();

// Inicializar variáveis
$nome = $email = $telefone = $cpf = $senha = $senha_hash = $salt = $data_nascimento = $cep = $estado = $cidade = $rua = $numero = "";
$erros = [];

// Se o formulário foi enviado
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    include_once("config.php");

    // Pegar os dados do POST
    $nome = trim($_POST['nome']);
    $email = trim($_POST['email']);
    $telefone = trim($_POST['telefone']);
    $cpf = trim($_POST['cpf']);
    $senha = trim($_POST['senha']);
    $senha_hash = trim($_POST['senha_hash']);
    $salt = trim($_POST['salt']);
    $data_nascimento = trim($_POST['data_nascimento']);
    $cep = trim($_POST['cep']);
    $estado = trim($_POST['estado']);
    $cidade = trim($_POST['cidade']);
    $rua = trim($_POST['rua']);
    $numero = trim($_POST['numero']);


    // Validar Nome
    if (empty($nome)) {
        $erros[] = "O nome é obrigatório.";
    } elseif (!preg_match("/^[a-zA-ZÀ-ú\s]+$/u", $nome)) {
        $erros[] = "O nome deve conter apenas letras e espaços.";
    }

    // Validar E-mail
    if (empty($email)) {
        $erros[] = "O e-mail é obrigatório.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erros[] = "Formato de e-mail inválido.";
    }

    // Validar Telefone
    $telefone_limpo = preg_replace('/\D/', '', $telefone);
    if (empty($telefone_limpo)) {
        $erros[] = "O telefone é obrigatório.";
    } elseif (!preg_match("/^\d{10,11}$/", $telefone_limpo)) {
        $erros[] = "O telefone deve ter 10 ou 11 dígitos.";
    }

    // Validar CPF
    $cpf_limpo = preg_replace('/\D/', '', $cpf);
    if (empty($cpf_limpo)) {
        $erros[] = "O CPF é obrigatório.";
    } elseif (strlen($cpf_limpo) != 11 || !validarCPF($cpf_limpo)) {
        $erros[] = "CPF inválido.";
    }

    // Validar CEP
    $cep_limpo = preg_replace('/\D/', '', $cep);
    if (empty($cep_limpo)) {
        $erros[] = "O CEP é obrigatório.";
    } elseif (!preg_match("/^\d{8}$/", $cep_limpo)) {
        $erros[] = "O CEP deve ter 8 dígitos.";
    }

    // Validar Endereço
    if (empty($endereco)) {
        $erros[] = "O endereço é obrigatório.";
    }

    // Validar Bairro
    if (empty($bairro)) {
        $erros[] = "O bairro é obrigatório.";
    }

    // Validar Cidade
    if (empty($cidade)) {
        $erros[] = "A cidade é obrigatória.";
    }

    // Validar Estado
    if (empty($estado)) {
        $erros[] = "O estado é obrigatório.";
    } elseif (!preg_match("/^[A-Z]{2}$/", strtoupper($estado))) {
        $erros[] = "Estado deve ter 2 letras maiúsculas (UF).";
    }

    // Validar Data de Nascimento
    if (empty($data_nascimento)) {
        $erros[] = "A data de nascimento é obrigatória.";
    } elseif (!validarData($data_nascimento)) {
        $erros[] = "Data de nascimento inválida.";
    }

    // Validar Senha Hash
    if (empty($senha_hash)) {
        $erros[] = "Erro interno: senha não enviada.";
    }

    // Validar Salt
    if (empty($salt)) {
        $erros[] = "Erro interno: salt não enviado.";
    }

    // Função para validar CPF
    function validarCPF($cpf)
    {
        if (preg_match('/(\d)\1{10}/', $cpf)) return false;
        for ($t = 9; $t < 11; $t++) {
            for ($d = 0, $c = 0; $c < $t; $c++) {
                $d += $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) {
                return false;
            }
        }
        return true;
    }

    // Função para validar data
    function validarData($data)
    {
        $data = preg_replace('/\D/', '', $data);
        if (strlen($data) != 8) return false;
        $dia = substr($data, 0, 2);
        $mes = substr($data, 2, 2);
        $ano = substr($data, 4, 4);
        return checkdate($mes, $dia, $ano);
    }
    if (empty($erros)) {
        // Usar prepared statements para segurança
        $stmt = mysqli_prepare($conn, "INSERT INTO usuarios (nome, email, telefone, cpf, senha, senha_hash, salt, data_nascimento, cep, estado, cidade, rua, numero) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "sss", $nome, $email, $telefone, $cpf, $senha, $senha_hash, $salt, $data_nascimento, $cep, $estado, $cidade, $rua,  $numero);
            if (mysqli_stmt_execute($stmt)) {
                $mensagem = "Usuário cadastrado com sucesso!";

                // Limpar campos após cadastro
                $nome = $email = $telefone = $cpf = $senha = $senha_hash = $salt = $data_nascimento = $cep = $estado = $cidade = $rua = $numero = "";

                header("Location: cadastro_ok.php");
                exit;
            } else {
                $erros[] = "Erro ao cadastrar: " . mysqli_stmt_error($stmt);
            }
            mysqli_stmt_close($stmt);
        } else {
            $erros = "Erro na preparação do cadastro: " . mysqli_error($conn);
        }
    } else {
        $mensagem = "Por favor, preencha todos os campos.";
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <title>Cadastro</title>

    <!-- Favicon -->
    <link rel="shortcut icon" href="/imagens/estrela.ico" type="image/x-icon">

    <!-- CSS -->
    <link rel="stylesheet" href="./css/cadastrocss.css">
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
            <img src="./imagens/estrela.ico" class="logo" alt="Logo Livraria Estrela">
        </div>

        <div class="navbar-content">
            <div class="avatar">
                <img src="./imagens/user-pic.jpg" alt="Usuário" width="40">
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

                <?php if (!empty($erros)): ?>
                    <div style="color: red;">
                        <ul>
                            <?php foreach ($erros as $erro): ?>
                                <li><?php echo htmlspecialchars($erro, ENT_QUOTES, 'UTF-8'); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>

                <form class="form-adm" action="php/processa_cadastro.php" method="post" id="cadastroForm" novalidate>
                    <!-- Seção Dados Pessoais -->
                    <div class="field-group">
                        <div class="field-group-title">Dados Pessoais</div>

                        <!-- Nome -->
                        <div class="form-row">
                            <div class="form-col full-width">
                                <label class="title-input" for="name">Nome completo</label>
                                <input type="text" name="name" id="name" class="input-adm"
                                    maxlength="100" required value="<?php echo htmlspecialchars($nome, ENT_QUOTES, 'UTF-8'); ?>"
                                    placeholder="Digite seu nome completo">
                            </div>
                        </div>

                        <!-- Email -->
                        <div class="form-row">
                            <div class="form-col full-width">
                                <label class="title-input" for="email">Email</label>
                                <input type="email" name="email" id="email" class="input-adm"
                                    maxlength="100" required value="<?php echo htmlspecialchars($email, ENT_QUOTES, 'UTF-8'); ?>"
                                    placeholder="exemplo@email.com">

                            </div>
                        </div>

                        <!-- Telefone e CPF -->
                        <div class="form-row">
                            <div class="form-col">

                                <label class="title-input" for="telefone">Telefone</label>
                                <input class="input-adm"
                                    type="tel" id="telefone" name="telefone" maxlength="15" required
                                    value="<?php echo htmlspecialchars($telefone, ENT_QUOTES, 'UTF-8'); ?>" placeholder="(00) 00000-0000">

                            </div>

                            <div class="form-col">

                                <label class="title-input" for="cpf">CPF</label>
                                <input class="input-adm"
                                    type="text" id="cpf" name="cpf" maxlength="14" required
                                    value="<?php echo htmlspecialchars($cpf, ENT_QUOTES, 'UTF-8'); ?>"
                                    placeholder="000.000.000-00">

                            </div>
                        </div>

                        <!-- Senha e Data Nascimento -->
                        <div class="form-row">
                            <div class="form-col">
                                <label class="title-input" for="senha">Senha (12-20 caracteres)</label>
                                <div class="password-container">
                                    <input class="input-adm"
                                        type="password" id="senha" name="senha" maxlength="20" minlength="12" required
                                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,20}$" placeholder="Mínimo 12 caracteres" value="<?php echo htmlspecialchars($senha, ENT_QUOTES, 'UTF-8'); ?>">

                                    <input type="hidden" id="senha_hash" name="senha_hash">
                                    <input type="hidden" id="salt" name="salt">

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

                            </div>

                            <div class="form-col">
                                <label class="title-input" for="data_nascimento">Data de Nascimento</label>
                                <input class="input-adm"
                                    type="text" id="data_nascimento" name="data_nascimento" maxlength="10" required
                                    value="<?php echo htmlspecialchars($data_nascimento, ENT_QUOTES, 'UTF-8'); ?>"
                                    placeholder="dd/mm/aaaa">

                            </div>
                        </div>

                        <!-- Seção Endereço -->
                        <div class="field-group">
                            <div class="field-group-title">Endereço</div>

                            <!-- CEP e Estado -->
                            <div class="form-row">
                                <div class="form-col">
                                    <label class="title-input" for="cep">CEP</label>
                                    <input class="input-adm"
                                        type="text" id="cep" name="cep" maxlength="9" required
                                        value="<?php echo htmlspecialchars($cep, ENT_QUOTES, 'UTF-8'); ?>">

                                </div>

                                <div class="form-col">
                                    <label class="title-input" for="estado">Estado</label>
                                    <input class="input-adm"
                                        id="estado" name="estado" type="text" maxlength="2" required value="<?php echo htmlspecialchars($estado, ENT_QUOTES, 'UTF-8'); ?>">

                                </div>
                            </div>

                            <!-- Cidade -->
                            <div class="form-row">
                                <div class="form-col full-width">
                                    <label class="title-input" for="cidade">Cidade</label>
                                    <input class="input-adm"
                                        type="text" id="cidade" name="cidade" maxlength="50" required
                                        value="<?php echo htmlspecialchars($cidade, ENT_QUOTES, 'UTF-8'); ?>">

                                </div>
                            </div>

                            <!-- Rua e Número -->
                            <div class="form-row">
                                <div class="form-col large">
                                    <label class="title-input" for="rua">Rua</label>
                                    <input class="input-adm <?= isset($errorMessages['rua']) ? 'error' : '' ?>"
                                        type="text" id="rua" name="rua" maxlength="100" required
                                        value="<?php echo htmlspecialchars($rua, ENT_QUOTES, 'UTF-8'); ?>">

                                </div>

                                <div class="form-col small">
                                    <label class="title-input" for="numero">Número</label>
                                    <input class="input-adm"
                                        type="text" id="numero" name="numero" maxlength="10" required
                                        value="<?php echo htmlspecialchars($numero, ENT_QUOTES, 'UTF-8'); ?>">

                                </div>
                            </div>
                        </div>

                        <button type="submit" class="btn-success" id="submitBtn">
                            <span id="submitText">Cadastrar</span>
                        </button>
                </form>
            </div>
        </div>
    </div>

    <!-- ============================================= -->
    <!-- 6. RODAPÉ E SCRIPTS -->
    <!-- ============================================= -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/imask/6.4.3/imask.min.js"></script>
    <script src="./js/cadastrojs.js"></script>
    <script src="./js/sitejs.js"></script>

</body>

</html>