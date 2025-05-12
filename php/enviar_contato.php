<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

require_once __DIR__ . '/../php/config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Requisição inválida.");
    }

    // 🔐 Validar entrada
    $nome     = trim($_POST['nome']     ?? '');
    $email    = trim($_POST['email']    ?? '');
    $assunto  = trim($_POST['assunto']  ?? '');
    $mensagem = trim($_POST['mensagem'] ?? '');

    if (!$nome || !$email || !$assunto || !$mensagem) {
        throw new Exception("Todos os campos são obrigatórios.");
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("E-mail inválido.");
    }

    // 💾 Salvar no banco
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("INSERT INTO mensagens_contato (nome, email, assunto, mensagem) VALUES (?, ?, ?, ?)");
    $stmt->execute([$nome, $email, $assunto, $mensagem]);

    // 📧 Enviar por e-mail
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $_ENV['MAIL_HOST'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $_ENV['MAIL_USER'];
    $mail->Password   = $_ENV['MAIL_PASS'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $_ENV['MAIL_PORT'];

    $mail->setFrom($_ENV['MAIL_USER'], 'Contato do Site');
    $mail->addAddress($_ENV['MAIL_TO']); // destino do e-mail

    $mail->Subject = "Nova mensagem de contato: $assunto";
    $mail->Body    = "Nome: $nome\nEmail: $email\nAssunto: $assunto\nMensagem:\n$mensagem";

    $mail->send();

    echo json_encode(["success" => true, "message" => "Mensagem enviada com sucesso."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Erro: " . $e->getMessage()]);
}
