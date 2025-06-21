<?php
require_once "config.php";
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/SMTP.php';
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PragmaRX\Google2FA\Google2FA;

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método não permitido."]);
    exit;
}

$dados = json_decode(file_get_contents("php://input"), true);
if (!$dados) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Dados JSON inválidos."]);
    exit;
}

$camposObrigatorios = ["email", "senha", "nome"];
foreach ($camposObrigatorios as $campo) {
    if (empty($dados[$campo])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "O campo '$campo' é obrigatório."]);
        exit;
    }
}

$pdo = getDatabaseConnection();

// Verifica se email já existe
$stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->execute([$dados["email"]]);
if ($stmt->fetch()) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email já cadastrado."]);
    exit;
}

// Gera token de ativação
$token = bin2hex(random_bytes(16));

// Gera segredo MFA
$google2fa = new Google2FA();
$mfaSecret = $google2fa->generateSecretKey();
$mfaAtivo = 1;

// Gera hash moderno
$senhaHashModerna = password_hash($dados["senha"], PASSWORD_DEFAULT);

// Insere na tabela usuarios com MFA ativado
$stmt = $pdo->prepare("
    INSERT INTO usuarios (
        email, senha_modern_hash, token_ativacao, mfa_enabled, mfa_secret
    ) VALUES (?, ?, ?, ?, ?)
");
$stmt->execute([
    $dados["email"],
    $senhaHashModerna,
    $token,
    $mfaAtivo,
    $mfaSecret
]);

$usuarioId = $pdo->lastInsertId();

// Insere dados complementares
$stmt = $pdo->prepare("
    INSERT INTO dados_cadastrais (
        usuario_id, nome, telefone, cpf, data_nascimento, cep, rua, numero, estado, cidade
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([
    $usuarioId,
    $dados["nome"] ?? '',
    $dados["telefone"] ?? '',
    $dados["cpf"] ?? '',
    $dados["data_nascimento"] ?? null,
    $dados["cep"] ?? '',
    $dados["rua"] ?? '',
    $dados["numero"] ?? '',
    $dados["estado"] ?? '',
    $dados["cidade"] ?? ''
]);

// Envia email com link de ativação
$linkAtivacao = $_ENV["URL_BASE"] . "/php/ativar_conta.php?token=" . $token;

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = $_ENV["SMTP_HOST"];
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV["SMTP_USER"];
    $mail->Password = $_ENV["SMTP_PASS"];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $_ENV["SMTP_PORT"];

    $mail->setFrom($_ENV["SMTP_FROM"], "Livraria");
    $mail->addAddress($dados["email"], $dados["nome"]);
    $mail->isHTML(true);
    $mail->Subject = "Ative sua conta";
    $mail->Body = "Olá, {$dados["nome"]}!<br><br>
        Ative sua conta clicando <a href='$linkAtivacao'>aqui</a>.<br><br>
        Após o login, escaneie seu código QR para concluir o uso de autenticação MFA.";

    $mail->send();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao enviar email de ativação."]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Cadastro realizado com sucesso! Verifique seu e-mail para ativar sua conta."
]);
exit;
