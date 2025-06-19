<?php
header('Content-Type: application/json');
require_once 'config.php'; // ajusta o caminho conforme a estrutura

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

$email = $_POST['email'] ?? '';

if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Email é obrigatório.']);
    exit;
}

// Verifica se o email existe no banco
$stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario) {
    echo json_encode(['success' => false, 'message' => 'Email não encontrado.']);
    exit;
}

// Gera token e data de expiração (ex: 1 hora)
$token = bin2hex(random_bytes(32));
$expiracao = date('Y-m-d H:i:s', time() + 3600); // 1 hora

// Remove tokens antigos e salva o novo
$pdo->prepare("DELETE FROM tokens_redefinicao WHERE email = ?")->execute([$email]);
$pdo->prepare("INSERT INTO tokens_redefinicao (email, token, expiracao) VALUES (?, ?, ?)")
    ->execute([$email, $token, $expiracao]);

// Gera link de redefinição
$link = "http://bcs-expcriativa3.local/novasenha.html?token=$token&email=" . urlencode($email); // ajuste domínio

// === Enviar e-mail com PHPMailer ===
$mail = new PHPMailer(true);

try {
    // Configurações do SMTP (ajuste com suas credenciais)
    $mail->isSMTP();
    $mail->Host = $_ENV['SMTP_HOST'];
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['SMTP_USER'];
    $mail->Password = $_ENV['SMTP_PASS'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $_ENV['SMTP_PORT'];

    $mail->setFrom($_ENV['SMTP_FROM'], "Livraria");
    $mail->addAddress($email);

    $mail->isHTML(true);
    $mail->Subject = 'Redefinição de Senha - Livraria';
    $mail->Body = "<p>Você solicitou uma redefinição de senha.</p>
                   <p><a href='$link'>Clique aqui para redefinir</a></p>
                   <p>Este link expira em 1 hora.</p>";

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'E-mail enviado com instruções.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao enviar o e-mail: ' . $mail->ErrorInfo]);
}
?>
