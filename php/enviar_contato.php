<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/cripto_hibrida.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dotenv\Dotenv;

// Carrega variáveis do .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

try {
    $dados = descriptografarEntrada();

    $nome     = trim($dados['nome']     ?? '');
    $email    = trim($dados['email']    ?? '');
    $assunto  = trim($dados['assunto']  ?? '');
    $mensagem = trim($dados['mensagem'] ?? '');

    $erros = [];

    if (strlen($nome) < 3) {
        $erros[] = "O nome deve conter pelo menos 3 caracteres.";
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erros[] = "Informe um e-mail válido.";
    }

    if (strlen($mensagem) < 10) {
        $erros[] = "A mensagem deve conter no mínimo 10 caracteres.";
    }

    if (!empty($erros)) {
        echo json_encode([
            "success" => false,
            "message" => implode(' ', $erros)
        ]);
        exit;
    }

    // PHPMailer com variáveis do .env
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $_ENV['SMTP_HOST'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $_ENV['SMTP_USER'];
    $mail->Password   = $_ENV['SMTP_PASS'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $_ENV['SMTP_PORT'];

    $mail->setFrom($_ENV['SMTP_FROM'], 'Contato - ExpCriativa');
    $mail->addAddress($_ENV['SMTP_FROM'], 'Destinatário'); // pode usar outro se quiser

    $mail->Subject = "[$assunto] Mensagem de $nome";
    $mail->Body    = "Nome: $nome\nEmail: $email\nAssunto: $assunto\n\nMensagem:\n$mensagem";
    $mail->CharSet = 'UTF-8';

    $mail->send();

    echo json_encode([
        "success" => true,
        "message" => "Mensagem enviada com sucesso!"
    ]);

} catch (Exception $e) {
    error_log("📧 Erro PHPMailer: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Erro ao enviar o e-mail. Verifique os dados do servidor SMTP."
    ]);
} catch (Throwable $e) {
    error_log("❌ Erro geral: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Erro interno no servidor."
    ]);
}
