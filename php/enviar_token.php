<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cripto_hibrida.php';

header('Content-Type: application/json');

// Não tente usar $aesKey antes de definir!
// Primeiro: validação do payload
$entradaJson = file_get_contents('php://input');
$data = json_decode($entradaJson, true);

if (!$data || !isset($data['encryptedKey'], $data['iv'], $data['encryptedMessage'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Payload criptografado ausente!']);
    exit;
}

try {
    // Só aqui você pode usar $aesKey e $iv:
    $entrada = descriptografarEntrada();
    $input = $entrada['dados'];
    $aesKey = $entrada['aesKey'];
    $iv = $entrada['iv'];

    // --- Lógica do envio do token ---
    $email = $input['email'] ?? null;

    if (!$email) {
        resposta_criptografada(
            ['success' => false, 'message' => "E-mail ausente.", 'debug' => 'Criptografia na volta: erro'],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

    $pdo = getDatabaseConnection();

    $stmt = $pdo->prepare("SELECT id, email FROM usuarios WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        resposta_criptografada(
            ['success' => false, 'message' => 'E-mail não encontrado.', 'debug' => 'Criptografia na volta: erro'],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

    // Gera e salva o token de ativação
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare("UPDATE usuarios SET token_ativacao = :token_ativacao, ativado = 0 WHERE id = :id");
    $stmt->execute([
        ':token_ativacao' => $token,
        ':id' => $user['id']
    ]);

    // Monta o link de redefinição (ajuste a URL/pasta se necessário)
    $url_base = $_ENV['URL_BASE'] ?? getenv('URL_BASE') ?? 'http://localhost';
    $link = $url_base . "/php/ativar_conta.php?token=" . $token;

    // PHPMailer
    require_once __DIR__ . '/../vendor/autoload.php';
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = $_ENV['SMTP_HOST'];
        $mail->SMTPAuth = true;
        $mail->Username = $_ENV['SMTP_USER'];
        $mail->Password = $_ENV['SMTP_PASS'];
        $mail->SMTPSecure = 'tls';
        $mail->Port = $_ENV['SMTP_PORT'];
        $mail->setFrom($_ENV['SMTP_FROM'], 'Equipe Livraria');
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = "Redefina sua senha";
        $mail->Body = "
            <p>Olá!</p>
            <p>Você solicitou a redefinição de senha. Clique no link abaixo para criar uma nova senha:</p>
            <p><a href='$link'>$link</a></p>
            <p>Se não foi você, ignore este e-mail.</p>
        ";
        $mail->AltBody = "Olá! Use o link: $link";

        $mail->send();

        resposta_criptografada(
            [
                'success' => true,
                'message' => 'Token de redefinição enviado para o seu e-mail!',
                'debug' => 'Criptografia na volta: resposta criptografada com AES.'
            ],
            $aesKey,
            base64_encode($iv)
        );
    } catch (Exception $e) {
        resposta_criptografada(
            [
                'success' => false,
                'message' => 'Erro ao enviar e-mail: ' . $mail->ErrorInfo,
                'debug' => 'Criptografia na volta: erro'
            ],
            $aesKey,
            base64_encode($iv)
        );
    }

} catch (Exception $e) {
    // Se $aesKey ainda não existir, responda JSON puro
    if (!isset($aesKey)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro ao descriptografar a chave AES.']);
        exit;
    }
    resposta_criptografada(
        ['success' => false, 'message' => 'Erro ao enviar token.', 'debug' => 'Criptografia na volta: erro', 'error' => $e->getMessage()],
        $aesKey,
        base64_encode($iv)
    );
}
?>
