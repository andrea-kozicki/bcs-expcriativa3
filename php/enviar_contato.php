<?php
ob_start();
require_once 'config.php';
require '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome     = htmlspecialchars(trim($_POST['nome'] ?? ''), ENT_QUOTES, 'UTF-8');
    $email    = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
    $assunto  = htmlspecialchars(trim($_POST['assunto'] ?? ''), ENT_QUOTES, 'UTF-8');
    $mensagem = htmlspecialchars(trim($_POST['mensagem'] ?? ''), ENT_QUOTES, 'UTF-8');

    $erros = [];

    if (strlen($nome) < 3) {
        $erros[] = "O nome deve conter pelo menos 3 caracteres.";
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erros[] = "Informe um e-mail válido.";
    }

    if ($assunto === 'Selecione') {
        $erros[] = "Selecione um assunto válido.";
    }

    if (strlen($mensagem) < 10) {
        $erros[] = "A mensagem deve conter no mínimo 10 caracteres.";
    }

    if (!empty($erros)) {
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => implode(" ", $erros)]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO mensagens_contato (nome, email, assunto, mensagem) VALUES (:nome, :email, :assunto, :mensagem)");
        $stmt->execute([
            ':nome'     => $nome,
            ':email'    => $email,
            ':assunto'  => $assunto,
            ':mensagem' => $mensagem
        ]);
    } catch (PDOException $e) {
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'Erro ao salvar no banco: ' . $e->getMessage()]);
        exit;
    }

    // Envio via SMTP
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = $_ENV['SMTP_HOST'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['SMTP_USER'];
        $mail->Password   = $_ENV['SMTP_PASS'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $_ENV['SMTP_PORT'];

        $mail->setFrom($_ENV['SMTP_FROM'], 'Formulário de Contato');
        $mail->addAddress($_ENV['SMTP_FROM']);
        $mail->addReplyTo($email, $nome);

        $mail->Subject = "Contato do site - $assunto";
        $mail->Body    = "Nome: $nome\nEmail: $email\nAssunto: $assunto\nMensagem:\n$mensagem";

        $mail->send();

        ob_end_clean();
        echo json_encode(['success' => true, 'message' => 'Mensagem enviada com sucesso!']);
    } catch (Exception $e) {
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'Mensagem registrada, mas houve erro ao enviar o e-mail: ' . $mail->ErrorInfo]);
    }
    exit;

} else {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Método de requisição inválido.']);
    exit;
}
