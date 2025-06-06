<?php
require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dotenv\Dotenv;

// Carrega variáveis do .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Função auxiliar para resposta JSON
function sendJson($success, $message) {
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

// Validação básica
if (
    empty($_POST['nome']) ||
    empty($_POST['email']) ||
    empty($_POST['assunto']) ||
    empty($_POST['mensagem'])
) {
    sendJson(false, "Todos os campos são obrigatórios.");
}

// Sanitize
$nome = filter_var(trim($_POST['nome']), FILTER_SANITIZE_SPECIAL_CHARS);
$email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
$assunto = filter_var(trim($_POST['assunto']), FILTER_SANITIZE_SPECIAL_CHARS);
$mensagem = filter_var(trim($_POST['mensagem']), FILTER_SANITIZE_SPECIAL_CHARS);

// Envio do e-mail
try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $_ENV['EMAIL_HOST'];
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['EMAIL_USERNAME'];
    $mail->Password = $_ENV['EMAIL_PASSWORD'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $_ENV['EMAIL_PORT'];

    $mail->setFrom($_ENV['EMAIL_USERNAME'], 'Formulário de Contato');
    $mail->addAddress($_ENV['MAIL_TO']);

    $mail->isHTML(true);
    $mail->Subject = "Novo contato: $assunto";
    $mail->Body = "
        <strong>Nome:</strong> {$nome}<br>
        <strong>Email:</strong> {$email}<br>
        <strong>Assunto:</strong> {$assunto}<br>
        <strong>Mensagem:</strong><br>
        <p>{$mensagem}</p>
    ";

    $mail->send();

} catch (Exception $e) {
    sendJson(false, "Erro ao enviar e-mail: {$mail->ErrorInfo}");
}

// Conexão com banco de dados
require_once __DIR__ . '/../php/config.php';

try {
    $pdo = new PDO(
        "mysql:dbname={$db_name};unix_socket={$db_socket}",
        $db_user,
        $db_pass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "INSERT INTO mensagens_contato (nome, email, assunto, mensagem) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$nome, $email, $assunto, $mensagem]);

} catch (PDOException $e) {
    sendJson(false, "Erro ao salvar no banco: " . $e->getMessage());
}

sendJson(true, "Mensagem enviada com sucesso.");
