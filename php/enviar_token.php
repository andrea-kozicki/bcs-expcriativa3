<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cripto_hibrida.php';

function resposta_criptografada($dados, $aes_key, $iv_base64) {
    $json = json_encode($dados);
    $iv = base64_decode($iv_base64);
    $encrypted = openssl_encrypt($json, 'aes-256-cbc', $aes_key, OPENSSL_RAW_DATA, $iv);
    echo json_encode([
        'encryptedMessage' => base64_encode($encrypted),
        'iv' => $iv_base64
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['encryptedKey'], $data['iv'], $data['encryptedMessage'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Payload criptografado ausente!']);
    exit;
}

try {
    $input = descriptografarEntrada();

    $iv = base64_decode($data['iv']);
    $encryptedMessage = base64_decode($data['encryptedMessage']);
    $decrypted_json = openssl_decrypt($encryptedMessage, 'aes-256-cbc', $aes_key, OPENSSL_RAW_DATA, $iv);
    $input = json_decode($decrypted_json, true);

    $email = $input['email'] ?? '';

    if (empty($email)) {
        $resposta = [
            'success' => false,
            'message' => 'E-mail ausente.',
            'debug' => 'Criptografia na volta: resposta de erro criptografada.'
        ];
        resposta_criptografada($resposta, $aes_key, $data['iv']);
    }

    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("SELECT id, email FROM usuarios WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $resposta = [
            'success' => false,
            'message' => 'Usuário não encontrado.',
            'debug' => 'Criptografia na volta: resposta de erro criptografada.'
        ];
        resposta_criptografada($resposta, $aes_key, $data['iv']);
    }

    // Gera e salva o token de ativação
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare("UPDATE usuarios SET token_ativacao = :token_ativacao, ativado = 0 WHERE id = :id");
    $stmt->execute([
        ':token_ativacao' => $token,
        ':id' => $user['id']
    ]);

    // Monta link de ativação
    $url_base = getenv('URL_BASE') ?: 'http://localhost';
    $link = $url_base . "/ativar_conta.php?token=" . $token;

    // PHPMailer
    require_once __DIR__ . '/../vendor/autoload.php';
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = getenv('SMTP_HOST');
        $mail->SMTPAuth = true;
        $mail->Username = getenv('SMTP_USER');
        $mail->Password = getenv('SMTP_PASS');
        $mail->SMTPSecure = 'tls';
        $mail->Port = getenv('SMTP_PORT');
        $mail->setFrom(getenv('SMTP_FROM'), 'Equipe Livraria');
        $mail->addAddress($email, $email); // Usando e-mail como nome (ajuste se quiser)
        $mail->isHTML(true);
        $mail->Subject = "Ative sua conta";
        $mail->Body = "
            <p>Olá!</p>
            <p>Clique no link abaixo para ativar sua conta:</p>
            <p><a href='$link'>$link</a></p>
            <p>Se não foi você, ignore este e-mail.</p>
        ";
        $mail->AltBody = "Olá! Use o link: $link";

        $mail->send();

        $resposta = [
            'success' => true,
            'message' => 'Token de ativação enviado para o seu e-mail!',
            'debug' => 'Criptografia na volta: esta resposta foi criptografada com a mesma chave AES da ida.'
        ];
        resposta_criptografada($resposta, $aes_key, $data['iv']);

    } catch (Exception $e) {
        $resposta = [
            'success' => false,
            'message' => 'Erro ao enviar e-mail: ' . $mail->ErrorInfo,
            'debug' => 'Criptografia na volta: resposta de erro criptografada.'
        ];
        resposta_criptografada($resposta, $aes_key, $data['iv']);
    }

} catch (Exception $e) {
    $resposta = [
        'success' => false,
        'message' => 'Erro ao enviar token.',
        'debug' => 'Criptografia na volta: resposta de erro criptografada.',
        'error' => $e->getMessage()
    ];
    if (!isset($aes_key)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro ao descriptografar a chave AES.']);
        exit;
    }
    resposta_criptografada($resposta, $aes_key, $data['iv']);
}
?>
