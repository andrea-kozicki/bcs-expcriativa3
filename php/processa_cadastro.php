<?php
/**
 * Processador de Cadastro
 * 
 * Responsável por validar e processar os dados do formulário
 * de cadastro e interagir com o banco de dados
 */

// ==============================================
// 1. CONFIGURAÇÕES INICIAIS
// ==============================================

// Buffer de saída para evitar problemas com redirecionamentos
ob_start();

// Carrega configurações
require_once __DIR__ . '/../config.php';

// Configurações de sessão
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'secure' => false, // Ativar em produção com HTTPS
    'httponly' => true,
    'samesite' => 'Lax'
]);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ==============================================
// 2. VALIDAÇÃO DA REQUISIÇÃO
// ==============================================

// Aceita apenas requisições POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $_SESSION['error_messages']['general'] = 'Método de requisição inválido.';
    header('Location: ' . BASE_PATH . '/cadastro.php');
    exit;
}

// Verifica se existem dados POST
if (empty($_POST)) {
    $_SESSION['error_messages']['general'] = 'Nenhum dado recebido.';
    header('Location: ' . BASE_PATH . '/cadastro.php');
    exit;
}


// ==============================================
// SEÇÃO 4: FUNÇÕES AUXILIARES
// ==============================================

/**
 * 4.1 Validação de CPF
 */
function validaCPF($cpf) {
    $cpf = preg_replace('/[^0-9]/', '', $cpf);
    
    if (strlen($cpf) != 11 || preg_match('/(\d)\1{10}/', $cpf)) {
        return false;
    }

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

/**
 * 4.2 Validação de Data de Nascimento
 */
function validaDataNascimento($data) {
    $dataAtual = new DateTime();
    $dataNascimento = DateTime::createFromFormat('d-m-Y', $data);
    
    if (!$dataNascimento) {
        return false;
    }
    
    $idade = $dataAtual->diff($dataNascimento)->y;
    return ($idade >= 12 && $idade <= 120);
}

// ==============================================
// SEÇÃO 5: SANITIZAÇÃO E VALIDAÇÃO DE DADOS
// ==============================================

/**
 * 5.1 Definição dos filtros para cada campo
 */
$filtros = [
    'name' => FILTER_SANITIZE_SPECIAL_CHARS,
    'email' => FILTER_SANITIZE_EMAIL,
    'telefone' => FILTER_SANITIZE_SPECIAL_CHARS,
    'cpf' => FILTER_SANITIZE_SPECIAL_CHARS,
    'data_nascimento' => FILTER_SANITIZE_SPECIAL_CHARS,
    'cep' => FILTER_SANITIZE_SPECIAL_CHARS,
    'estado' => FILTER_SANITIZE_SPECIAL_CHARS,
    'cidade' => FILTER_SANITIZE_SPECIAL_CHARS,
    'rua' => FILTER_SANITIZE_SPECIAL_CHARS,
    'numero' => FILTER_SANITIZE_SPECIAL_CHARS,
    'senha_hash' => FILTER_SANITIZE_SPECIAL_CHARS,
    'salt' => FILTER_SANITIZE_SPECIAL_CHARS
];

/**
 * 5.2 Sanitização dos dados
 */
$dados = filter_input_array(INPUT_POST, $filtros);
foreach ($filtros as $campo => $filtro) {
    $dados[$campo] = isset($_POST[$campo]) ? trim(filter_input(INPUT_POST, $campo, $filtro)) : '';
}

/**
 * 5.3 Validações específicas
 */
$erros = [];

// Validação de nome
if (empty($dados['name'])) {
    $erros['name'] = 'Nome é obrigatório.';
} elseif (strlen($dados['name']) < 5) {
    $erros['name'] = 'Nome deve ter pelo menos 5 caracteres.';
}

// Validação de email
if (empty($dados['email'])) {
    $erros['email'] = 'Email é obrigatório.';
} elseif (!filter_var($dados['email'], FILTER_VALIDATE_EMAIL)) {
    $erros['email'] = 'Email inválido.';
}

// Validação de senha (hash)
if (empty($dados['senha_hash']) || empty($dados['salt'])) {
    $erros['senha'] = 'Dados de segurança da senha incompletos.';
}

// Validação de CPF
$cpfLimpo = preg_replace('/[^0-9]/', '', $dados['cpf']);
if (empty($cpfLimpo)) {
    $erros['cpf'] = 'CPF é obrigatório.';
} elseif (strlen($cpfLimpo) !== 11 || !validaCPF($cpfLimpo)) {
    $erros['cpf'] = 'CPF inválido.';
}

// Validação de data de nascimento
if (empty($dados['data_nascimento'])) {
    $erros['data_nascimento'] = 'Data de nascimento é obrigatória.';
} elseif (!validaDataNascimento($dados['data_nascimento'])) {
    $erros['data_nascimento'] = 'Data de nascimento inválida.';
}

// [Adicione outras validações conforme necessário]

/**
 * 5.4 Tratamento de erros de validação
 */
if (!empty($erros)) {
    $_SESSION['error_messages'] = $erros;
    $_SESSION['form_data'] = $dados;
    header('Location: ' . BASE_PATH . '/cadastro.php');
    exit;
}

// ==============================================
// SEÇÃO 6: CONEXÃO COM O BANCO DE DADOS
// ==============================================

try {
    /**
     * 6.1 Estabelece conexão com o banco
     */
    $db = new PDO(
        "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8",
        DB_USER, 
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    error_log("Conexão com o banco estabelecida com sucesso");

    /**
     * 6.2 Verifica se email ou CPF já existem
     */
    $consulta = $db->prepare("SELECT id FROM usuarios WHERE email = :email OR cpf = :cpf");
    $consulta->execute([
        ':email' => $dados['email'],
        ':cpf' => $cpfLimpo
    ]);
    
    if ($consulta->rowCount() > 0) {
        error_log("Tentativa de cadastro duplicado: " . $dados['email']);
        $_SESSION['error_messages']['general'] = 'Email ou CPF já cadastrado.';
        header('Location: ' . BASE_PATH . '/cadastro.php');
        exit;
    }

    /**
     * 6.3 Prepara e executa a inserção
     */
    $sql = "INSERT INTO usuarios (
        nome, email, senha_hash, salt, telefone, cpf, data_nascimento,
        cep, estado, cidade, rua, numero, token_ativacao, data_cadastro
    ) VALUES (
        :nome, :email, :senha_hash, :salt, :telefone, :cpf, :data_nascimento,
        :cep, :estado, :cidade, :rua, :numero, :token, NOW()
    )";

    $stmt = $db->prepare($sql);
    

    if ($resultado) {
        $_SESSION['success_message'] = 'Cadastro realizado com sucesso!';
        header('Location: ' . BASE_PATH . '/cadastro_ok.php');
        exit;
    }

    
    // Formata a data para o banco
    $dataNascimento = DateTime::createFromFormat('d-m-Y', $dados['data_nascimento']);
    $dataNascimentoFormatada = $dataNascimento->format('Y-m-d');

    // Executa a inserção
    $resultado = $stmt->execute([
        ':nome' => $dados['name'],
        ':email' => $dados['email'],
        ':senha_hash' => $dados['senha_hash'],
        ':salt' => $dados['salt'],
        ':telefone' => preg_replace('/[^0-9]/', '', $dados['telefone']),
        ':cpf' => $cpfLimpo,
        ':data_nascimento' => $dataNascimentoFormatada,
        ':cep' => preg_replace('/[^0-9]/', '', $dados['cep']),
        ':estado' => $dados['estado'],
        ':cidade' => $dados['cidade'],
        ':rua' => $dados['rua'],
        ':numero' => $dados['numero'],
        ':token' => bin2hex(random_bytes(32))
    ]);

    /**
     * 6.4 Verifica o resultado da inserção
     */
    if (!$resultado) {
        error_log("Falha na execução da query: " . print_r($stmt->errorInfo(), true));
        throw new Exception("Falha ao executar query de inserção");
    }

    $ultimoId = $db->lastInsertId();
    if (!$ultimoId) {
        error_log("Nenhum ID retornado após inserção");
        throw new Exception("Falha ao obter ID do registro inserido");
    }

    error_log("Usuário cadastrado com sucesso - ID: $ultimoId");

    // ==============================================
    // SEÇÃO 7: PÓS-CADASTRO
    // ==============================================

    /**
     * 7.1 Envio de email de confirmação
     */
    $token = bin2hex(random_bytes(32));
    if (!enviarEmailConfirmacao($dados['email'], $dados['name'], $token)) {
        error_log("Falha ao enviar email para: " . $dados['email']);
    }

    /**
     * 7.2 Finalização com sucesso
     */
    unset($_SESSION['form_data']);
    $_SESSION['success_message'] = 'Cadastro realizado com sucesso!';
    header('Location: ' . BASE_PATH . '/cadastro_ok.php');
    exit;

} catch (PDOException $e) {
    /**
     * 7.3 Tratamento de erros do banco
     */
    error_log("ERRO PDO: " . $e->getMessage());
    $_SESSION['error_messages']['general'] = 'Erro no banco de dados. Tente novamente.';
    header('Location: ' . BASE_PATH . '/cadastro.php');
    exit;
} catch (Exception $e) {
    /**
     * 7.4 Tratamento de outros erros
     */
    error_log("ERRO GERAL: " . $e->getMessage());
    $_SESSION['error_messages']['general'] = 'Erro ao processar cadastro.';
    header('Location: ' . BASE_PATH . '/cadastro.php');
    exit;
}

// ==============================================
// SEÇÃO 8: FUNÇÕES ADICIONAIS
// ==============================================

/**
 * 8.1 Função para envio de email de confirmação
 */
function enviarEmailConfirmacao($email, $nome, $token) {
    if (!defined('SITE_NAME') || !defined('EMAIL_FROM') || !defined('SITE_URL')) {
        error_log("Constantes de configuração não definidas para email");
        return false;
    }

    $assunto = "Confirme seu cadastro no " . SITE_NAME;
    $link = SITE_URL . "/ativar_conta.php?token=" . $token;
    
    $mensagem = "Olá $nome,\n\n";
    $mensagem .= "Obrigado por se cadastrar no " . SITE_NAME . "!\n\n";
    $mensagem .= "Por favor, clique no link abaixo para confirmar seu cadastro:\n";
    $mensagem .= "$link\n\n";
    $mensagem .= "Atenciosamente,\nEquipe " . SITE_NAME;

    $headers = "From: " . EMAIL_FROM . "\r\n";
    $headers .= "Reply-To: " . EMAIL_FROM . "\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    return mail($email, $assunto, $mensagem, $headers);
}

// ==============================================
// 9. Finalização
// ==============================================

// Limpa o buffer e envia os headers
ob_end_flush();