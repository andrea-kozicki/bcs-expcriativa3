<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once 'cripto_hibrida.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

try {
    // Descriptografa a entrada (já retorna ['dados', 'aesKey', 'iv'])
    $entrada = descriptografarEntrada();
    $dados = $entrada['dados'];
    $aesKey = $entrada['aesKey'];
    $iv = $entrada['iv'];

    // Validação dos dados recebidos
    $nome = trim($dados['nome'] ?? '');
    $email = trim($dados['email'] ?? '');
    $assunto = trim($dados['assunto'] ?? '');
    $mensagem = trim($dados['mensagem'] ?? '');

    if (strlen($nome) < 3 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($assunto) < 3 || strlen($mensagem) < 10) {
        resposta_criptografada(
            ['success' => false, 'message' => 'Preencha todos os campos corretamente.', 'debug' => 'Criptografia na volta: erro'],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

    // Salva no banco
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("INSERT INTO mensagens_contato (nome, email, assunto, mensagem) VALUES (?, ?, ?, ?)");
    $stmt->execute([$nome, $email, $assunto, $mensagem]);

    // PHPMailer - envia o contato para o e-mail do site
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = $_ENV['SMTP_HOST'];
        $mail->SMTPAuth = true;
        $mail->Username = $_ENV['SMTP_USER'];
        $mail->Password = $_ENV['SMTP_PASS'];
        $mail->SMTPSecure = 'tls';
        $mail->Port = $_ENV['SMTP_PORT'];

        $mail->setFrom($_ENV['SMTP_FROM'], 'Contato do site');
        $mail->addAddress($_ENV['SMTP_FROM']); // Pode mudar para outro destinatário, se quiser
        $mail->addReplyTo($email, $nome);

        $mail->isHTML(true);
        $mail->Subject = 'Contato pelo site: ' . $assunto;
        $mail->Body    = "
            <h2>Mensagem recebida pelo formulário de contato</h2>
            <p><strong>Nome:</strong> {$nome}</p>
            <p><strong>E-mail:</strong> {$email}</p>
            <p><strong>Assunto:</strong> {$assunto}</p>
            <p><strong>Mensagem:</strong><br>{$mensagem}</p>
        ";
        $mail->AltBody = "Nome: {$nome}\nE-mail: {$email}\nAssunto: {$assunto}\nMensagem: {$mensagem}";

        $mail->send();

        resposta_criptografada(
            ['success' => true, 'message' => 'Mensagem enviada e registrada com sucesso!', 'debug' => 'Criptografia na volta: sucesso'],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    } catch (Exception $e) {
        resposta_criptografada(
            ['success' => false, 'message' => 'Erro ao enviar e-mail: ' . $mail->ErrorInfo, 'debug' => 'Criptografia na volta: erro'],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

} catch (Exception $e) {
    resposta_criptografada(
        ['success' => false, 'message' => 'Erro ao enviar contato.', 'debug' => 'Criptografia na volta: erro', 'error' => $e->getMessage()],
        $aesKey ?? '',
        isset($iv) ? base64_encode($iv) : ''
    );
    exit;
}
?>
