<?php
session_start();

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php'; // Carrega o PHPMailer

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    include_once("config.php");

    // Capturar os dados
    $nome = $_POST['nome'] ?? '';
    $email = $_POST['email'] ?? '';
    $telefone = $_POST['telefone'] ?? '';
    $cpf = $_POST['cpf'] ?? '';
    $senha_hash = $_POST['senha_hash'] ?? '';
    $salt = $_POST['salt'] ?? '';
    $data_nascimento = $_POST['data_nascimento'] ?? '';
    $cep = $_POST['cep'] ?? '';
    $estado = $_POST['estado'] ?? '';
    $endereco = $_POST['endereco'] ?? '';
    $bairro = $_POST['bairro'] ?? '';
    $cidade = $_POST['cidade'] ?? '';
    $rua = trim($_POST['rua']);
    $numero = trim($_POST['numero']);
    

    $erros = [];

    // Validações básicas

    // Nome
    if (empty($nome) || !preg_match("/^[a-zA-ZÀ-ú\s]+$/u", $nome)) {
        $erros[] = "Nome inválido.";
    }

    // E-mail
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erros[] = "E-mail inválido.";
    }

    // Telefone
    $telefone_limpo = preg_replace('/\D/', '', $telefone);
    if (empty($telefone_limpo) || !preg_match("/^\d{10,11}$/", $telefone_limpo)) {
        $erros[] = "Telefone inválido.";
    }

    // CPF
    $cpf_limpo = preg_replace('/\D/', '', $cpf);
    if (empty($cpf_limpo) || strlen($cpf_limpo) != 11) {
        $erros[] = "CPF inválido.";
    }

    // CEP
    $cep_limpo = preg_replace('/\D/', '', $cep);
    if (empty($cep_limpo) || strlen($cep_limpo) != 8) {
        $erros[] = "CEP inválido.";
    }

    // Endereço
    if (empty($endereco)) {
        $erros[] = "Endereço é obrigatório.";
    }

    // Bairro
    if (empty($bairro)) {
        $erros[] = "Bairro é obrigatório.";
    }

    // Cidade
    if (empty($cidade)) {
        $erros[] = "Cidade é obrigatória.";
    }

    // Estado
    if (empty($estado) || !preg_match("/^[A-Z]{2}$/", strtoupper($estado))) {
        $erros[] = "Estado (UF) inválido.";
    }

    // Data de Nascimento
    if (empty($data_nascimento) || !validarData($data_nascimento)) {
        $erros[] = "Data de nascimento inválida.";
    }

    // Senha Hash
    if (empty($senha_hash)) {
        $erros[] = "Senha inválida.";
    }

    // Salt
    if (empty($salt)) {
        $erros[] = "Erro interno: salt não enviado.";
    }

     // Rua
     if (empty($rua)) {
        $erros[] = "Rua é obrigatória.";
    }

    // Número
    if (empty($numero)) {
        $erros[] = "Número é obrigatório.";
    }

    // Se não houver erros, inserir no banco
    if (empty($erros)) {

         // Gerar token de ativação único
         $token_ativacao = bin2hex(random_bytes(16)); // 32 caracteres aleatórios

         // Inserir no banco
        $stmt = mysqli_prepare($conn, "INSERT INTO usuarios (nome, email, telefone, cpf, senha_hash, salt, data_nascimento, cep, estado, cidade, rua, numero) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "ssssssssssss", $nome, $email, $telefone_limpo, $cpf_limpo, $senha_hash, $salt,$data_nascimento, $cep_limpo, strtoupper($estado), $endereco, $bairro, $cidade, $rua , $numero);

            
            if (mysqli_stmt_execute($stmt)) {
                // Enviar e-mail de ativação
                enviarEmailAtivacao($email, $token_ativacao);
                header("Location: cadastro_ok.php");
                exit;
            } else {
                echo "Erro ao cadastrar: " . mysqli_stmt_error($stmt);
            }
            mysqli_stmt_close($stmt);
        } else {
            echo "Erro na preparação da consulta: " . mysqli_error($conn);
        }
    } else {
        foreach ($erros as $erro) {
            echo "<p style='color:red'>" . htmlspecialchars($erro, ENT_QUOTES, 'UTF-8') . "</p>";
        }
    }
}

// Função para validar a data no formato YYYY-MM-DD
function validarData($data) {
    $partes = explode('-', $data);
    if (count($partes) !== 3) return false;
    return checkdate((int)$partes[1], (int)$partes[2], (int)$partes[0]);
}

function enviarEmailAtivacao($emailDestino, $token) {
    $mail = new PHPMailer(true);

    try {
        // Configurações SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com'; // Exemplo: smtp.gmail.com
        $mail->SMTPAuth = true;
        $mail->Username = 'seuemail@seudominio.com'; // Seu email
        $mail->Password = 'suasenha'; // Sua senha
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Ou ENCRYPTION_SMTPS
        $mail->Port = 587; // TLS: 587, SSL: 465

        // Remetente e destinatário
        $mail->setFrom('no-reply@seudominio.com', 'Sistema de Cadastro');
        $mail->addAddress($emailDestino);

        // Conteúdo do email
        $mail->isHTML(true);
        $mail->Subject = 'Confirmação de Cadastro - Ative sua Conta';
        $mail->Body = '
            <p>Olá, obrigado por se cadastrar!</p>
            <p>Para ativar sua conta, clique no link abaixo:</p>
            <p><a href="http://localhost/bcs-expcriativa3/ativar_conta.php?token=' . urlencode($token) . '">Ativar Conta</a></p>
        ';

        $mail->send();
        return true;
    } catch (Exception $e) {
        // Pode registrar erro para análise
        error_log('Erro ao enviar email: ' . $mail->ErrorInfo);
        return false;
    }
}
?>
