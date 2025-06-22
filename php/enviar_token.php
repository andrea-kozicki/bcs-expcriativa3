<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cripto_hibrida.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

error_log("📨 Início do enviar_token.php");

// 🔐 Descriptografa os dados com criptografia híbrida
try {
    $dados = descriptografarEntrada();
} catch (Exception $e) {
    error_log("❌ Erro ao descriptografar dados: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Erro ao processar os dados enviados."]);
    exit;
}

$email = trim($dados['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error_log("❌ E-mail inválido: $email");
    echo json_encode(["success" => false, "message" => "E-mail inválido."]);
    exit;
}

$stmt = $pdo->prepare("SELECT id, ativado FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario) {
    error_log("⚠️ E-mail não encontrado: $email");
    echo json_encode(["success" => false, "message" => "Usuário não encontrado."]);
    exit;
}

// 🔄 Reenvia link de ativação, se necessário
if ((int)$usuario['ativado'] !== 1) {
    error_log("🔁 Conta não ativada — preparando novo envio...");
    error_log("🧾 Usuário ID: " . $usuario['id'] . ", Email: $email");

    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare("UPDATE usuarios SET token_ativacao = ? WHERE id = ?");
    $stmt->execute([$token, $usuario['id']]);

    $urlBase = $_ENV['URL_BASE'] ?? 'http://localhost';
    $link = "$urlBase/ativar_conta.php?token=$token";

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = $_ENV['SMTP_HOST'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['SMTP_USER'];
        $mail->Password   = $_ENV['SMTP_PASS'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $_ENV['SMTP_PORT'];

        $mail->setFrom($_ENV['SMTP_FROM'], 'Suporte');
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = 'Ative sua conta';
        $mail->Body    = "Olá!<br><br>Ative sua conta clicando <a href='$link'>aqui</a>.<br><br>Se não foi você, ignore este e-mail.";

        $mail->send();
        error_log("📬 Link de ativação reenviado com sucesso para $email");
        echo json_encode(["success" => false, "message" => "Conta ainda não ativada. Enviamos um novo e-mail com o link de ativação."]);
        exit;
    } catch (Exception $e) {
        error_log("❌ Erro ao reenviar link de ativação: " . $mail->ErrorInfo);
        echo json_encode(["success" => false, "message" => "Erro ao reenviar o e-mail de ativação."]);
        exit;
    }
}

// 📨 Se conta ativada, envia link de redefinição de senha normalmente
$token = bin2hex(random_bytes(32));
$stmt = $pdo->prepare("UPDATE usuarios SET token_ativacao = ? WHERE id = ?");
$stmt->execute([$token, $usuario['id']]);

$urlBase = $_ENV['URL_BASE'] ?? 'http://localhost';
$link = "$urlBase/novasenha.html?token=$token";

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = $_ENV['SMTP_HOST'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $_ENV['SMTP_USER'];
    $mail->Password   = $_ENV['SMTP_PASS'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $_ENV['SMTP_PORT'];

    $mail->setFrom($_ENV['SMTP_FROM'], 'Suporte');
    $mail->addAddress($email);
    $mail->isHTML(true);
    $mail->Subject = 'Redefinição de senha';
    $mail->Body    = "Olá!<br><br>Para redefinir sua senha, <a href='$link'>clique aqui</a>.<br><br>Se não foi você, ignore este e-mail.";

    $mail->send();
    error_log("📨 E-mail de redefinição enviado com sucesso para $email");
    echo json_encode(["success" => true, "message" => "E-mail enviado com instruções para redefinir a senha."]);
} catch (Exception $e) {
    error_log("❌ Erro ao enviar e-mail de redefinição: " . $mail->ErrorInfo);
    echo json_encode(["success" => false, "message" => "Erro ao enviar o e-mail de redefinição."]);
}
