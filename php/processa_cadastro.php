<?php
// processa_cadastro.php - Backend para processamento do formulário de cadastro

// Inicia a sessão para armazenar mensagens e dados do formulário
session_start();

// Inclui arquivo de configuração (se existir)
// require_once 'config.php';

// Habilita erros durante o desenvolvimento (desativar em produção)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define cabeçalhos para prevenir caching
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Verifica se o método de requisição é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $_SESSION['error_messages']['general'] = 'Método de requisição inválido.';
    header('Location: ../cadastro.php');
    exit;
}

// Verifica token CSRF (se implementado)
// if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
//     $_SESSION['error_messages']['general'] = 'Token de segurança inválido.';
//     header('Location: ../cadastro.php');
//     exit;
// }

// Função para validar CPF
function validaCPF($cpf) {
    // Remove caracteres não numéricos
    $cpf = preg_replace('/[^0-9]/', '', $cpf);
    
    // Verifica se foi informado todos os digitos corretamente
    if (strlen($cpf) != 11) {
        return false;
    }

    // Verifica se foi informada uma sequência de digitos repetidos
    if (preg_match('/(\d)\1{10}/', $cpf)) {
        return false;
    }

    // Faz o calculo para validar o CPF
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

// Função para validar data de nascimento
function validaDataNascimento($data) {
    $dataAtual = new DateTime();
    $dataNascimento = DateTime::createFromFormat('Y-m-d', $data);
    
    if (!$dataNascimento) {
        return false;
    }
    
    $idade = $dataAtual->diff($dataNascimento)->y;
    return ($idade >= 12 && $idade <= 120); // Idade entre 12 e 120 anos
}

// Função para buscar endereço por CEP
function buscaEnderecoPorCEP($cep) {
    $cep = preg_replace('/[^0-9]/', '', $cep);
    if (strlen($cep) != 8) {
        return false;
    }

    $url = "https://viacep.com.br/ws/{$cep}/json/";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return (json_last_error() === JSON_ERROR_NONE && !isset($data['erro'])) ? $data : false;
}

// Array para armazenar erros
$errors = [];
$formData = [];

// Sanitiza e valida cada campo
$campos = [
    'name' => FILTER_SANITIZE_STRING,
    'email' => FILTER_SANITIZE_EMAIL,
    'telefone' => FILTER_SANITIZE_STRING,
    'cpf' => FILTER_SANITIZE_STRING,
    'data_nascimento' => FILTER_SANITIZE_STRING,
    'cep' => FILTER_SANITIZE_STRING,
    'estado' => FILTER_SANITIZE_STRING,
    'cidade' => FILTER_SANITIZE_STRING,
    'rua' => FILTER_SANITIZE_STRING,
    'numero' => FILTER_SANITIZE_STRING,
    'senha_hash' => FILTER_SANITIZE_STRING
];

// Filtra e armazena os dados do formulário
foreach ($campos as $field => $filter) {
    $formData[$field] = isset($_POST[$field]) ? trim(filter_input(INPUT_POST, $field, $filter)) : '';
}

// Validações específicas para cada campo

// Nome
if (empty($formData['name'])) {
    $errors['name'] = 'Nome é obrigatório.';
} elseif (strlen($formData['name']) < 5) {
    $errors['name'] = 'Nome deve ter pelo menos 5 caracteres.';
}

// Email
if (empty($formData['email'])) {
    $errors['email'] = 'Email é obrigatório.';
} elseif (!filter_var($formData['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Email inválido.';
}

// Senha (hash)
if (empty($formData['senha_hash'])) {
    $errors['senha'] = 'Senha é obrigatória.';
} else {
    // Decodifica o hash da senha
    $senhaData = json_decode($formData['senha_hash'], true);
    if (json_last_error() !== JSON_ERROR_NONE || !isset($senhaData['hash']) || !isset($senhaData['salt'])) {
        $errors['senha'] = 'Problema ao processar a senha.';
    }
}

// Telefone
$telefoneLimpo = preg_replace('/[^0-9]/', '', $formData['telefone']);
if (empty($telefoneLimpo)) {
    $errors['telefone'] = 'Telefone é obrigatório.';
} elseif (strlen($telefoneLimpo) < 10 || strlen($telefoneLimpo) > 11) {
    $errors['telefone'] = 'Telefone deve ter 10 ou 11 dígitos.';
}

// CPF
$cpfLimpo = preg_replace('/[^0-9]/', '', $formData['cpf']);
if (empty($cpfLimpo)) {
    $errors['cpf'] = 'CPF é obrigatório.';
} elseif (strlen($cpfLimpo) !== 11) {
    $errors['cpf'] = 'CPF deve ter 11 dígitos.';
} elseif (!validaCPF($cpfLimpo)) {
    $errors['cpf'] = 'CPF inválido.';
}

// Data de Nascimento
if (empty($formData['data_nascimento'])) {
    $errors['data_nascimento'] = 'Data de nascimento é obrigatória.';
} elseif (!validaDataNascimento($formData['data_nascimento'])) {
    $errors['data_nascimento'] = 'Data de nascimento inválida.';
}

// CEP
$cepLimpo = preg_replace('/[^0-9]/', '', $formData['cep']);
if (empty($cepLimpo)) {
    $errors['cep'] = 'CEP é obrigatório.';
} elseif (strlen($cepLimpo) !== 8) {
    $errors['cep'] = 'CEP deve ter 8 dígitos.';
}

// Estado
if (empty($formData['estado'])) {
    $errors['estado'] = 'Estado é obrigatório.';
} elseif (strlen($formData['estado']) !== 2) {
    $errors['estado'] = 'Estado inválido.';
}

// Cidade
if (empty($formData['cidade'])) {
    $errors['cidade'] = 'Cidade é obrigatória.';
} elseif (strlen($formData['cidade']) < 3) {
    $errors['cidade'] = 'Cidade deve ter pelo menos 3 caracteres.';
}

// Rua
if (empty($formData['rua'])) {
    $errors['rua'] = 'Rua é obrigatória.';
} elseif (strlen($formData['rua']) < 5) {
    $errors['rua'] = 'Rua deve ter pelo menos 5 caracteres.';
}

// Número
if (empty($formData['numero'])) {
    $errors['numero'] = 'Número é obrigatório.';
}

// Verifica se há erros
if (!empty($errors)) {
    $_SESSION['error_messages'] = $errors;
    $_SESSION['form_data'] = $formData;
    header('Location: ../cadastro.php');
    exit;
}

// Se chegou aqui, os dados são válidos
// Processamento do cadastro (simulação - substituir por conexão real com banco de dados)

try {
    // Simulação de conexão com banco de dados
    // $db = new PDO('mysql:host=localhost;dbname=sua_database', 'usuario', 'senha');
    // $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verifica se email já está cadastrado
    // $stmt = $db->prepare("SELECT id FROM usuarios WHERE email = :email OR cpf = :cpf");
    // $stmt->execute([
    //     ':email' => $formData['email'],
    //     ':cpf' => $cpfLimpo
    // ]);
    
    // if ($stmt->rowCount() > 0) {
    //     $_SESSION['error_messages']['general'] = 'Email ou CPF já cadastrado.';
    //     $_SESSION['form_data'] = $formData;
    //     header('Location: ../cadastro.php');
    //     exit;
    // }
    
    // Decodifica os dados da senha
    $senhaData = json_decode($formData['senha_hash'], true);
    
    // Insere usuário no banco de dados (exemplo)
    // $stmt = $db->prepare("INSERT INTO usuarios (
    //     nome, email, senha_hash, salt, telefone, cpf, data_nascimento, 
    //     cep, estado, cidade, rua, numero, data_cadastro
    // ) VALUES (
    //     :nome, :email, :senha_hash, :salt, :telefone, :cpf, :data_nascimento,
    //     :cep, :estado, :cidade, :rua, :numero, NOW()
    // )");
    
    // $stmt->execute([
    //     ':nome' => $formData['name'],
    //     ':email' => $formData['email'],
    //     ':senha_hash' => $senhaData['hash'],
    //     ':salt' => $senhaData['salt'],
    //     ':telefone' => $telefoneLimpo,
    //     ':cpf' => $cpfLimpo,
    //     ':data_nascimento' => $formData['data_nascimento'],
    //     ':cep' => $cepLimpo,
    //     ':estado' => $formData['estado'],
    //     ':cidade' => $formData['cidade'],
    //     ':rua' => $formData['rua'],
    //     ':numero' => $formData['numero']
    // ]);
    
    // $userId = $db->lastInsertId();
    
    // Simulação de cadastro bem-sucedido
    $userId = mt_rand(1000, 9999); // Remover em produção
    
    // Limpa os dados da sessão
    unset($_SESSION['form_data']);
    unset($_SESSION['error_messages']);
    
    // Envia email de confirmação (simulação)
    // $assunto = "Confirmação de Cadastro";
    // $mensagem = "Olá " . $formData['name'] . ",\n\n";
    // $mensagem .= "Seu cadastro foi realizado com sucesso!\n";
    // $mensagem .= "Agora você pode acessar nossa plataforma com seu email e senha.\n\n";
    // $mensagem .= "Atenciosamente,\nEquipe da Livraria";
    
    // mail($formData['email'], $assunto, $mensagem);
    
    // Define mensagem de sucesso
    $_SESSION['success_message'] = 'Cadastro realizado com sucesso! Você já pode fazer login.';
    
    // Redireciona para página de login
    header('Location: ../login2.php');
    exit;
    
} catch (Exception $e) {
    // Em caso de erro no banco de dados
    error_log('Erro no cadastro: ' . $e->getMessage());
    $_SESSION['error_messages']['general'] = 'Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente.';
    $_SESSION['form_data'] = $formData;
    header('Location: ../cadastro.php');
    exit;
}

if (isset($_POST['senha_hash'])) {
    $hashData = json_decode($_POST['senha_hash'], true);
    echo "<pre>Dados recebidos:\n";
    print_r($hashData);
    
    // Verificação do hash
    $hashVerificado = hash('sha256', $_POST['senha'] . $hashData['salt']) === $hashData['hash'];
    echo "\nHash verificado: " . ($hashVerificado ? 'SIM' : 'NÃO');
} else {
    echo "Erro: Nenhum hash recebido";
}