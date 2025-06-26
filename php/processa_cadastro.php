<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cripto_hibrida.php';
require_once __DIR__ . '/../vendor/autoload.php'; // PHPMailer

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

try {
    $entrada = descriptografarEntrada();
    $input = $entrada['dados'];
    $aesKey = $entrada['aesKey'];
    $iv = $entrada['iv'];

    // === Validação ===
    $campos = ['nome', 'email', 'senha', 'telefone', 'cpf', 'data_nascimento', 'cep', 'rua', 'numero', 'estado', 'cidade'];
    foreach ($campos as $campo) {
        if (empty($input[$campo])) {
            resposta_criptografada(
                [
                    'success' => false,
                    'message' => "Campo obrigatório ausente: $campo",
                    'debug' => 'Criptografia na volta: resposta de erro criptografada.'
                ],
                $aesKey,
                base64_encode($iv)
            );
            exit;
        }
    }

    $pdo = getDatabaseConnection();

    // Verifica se já existe email ou cpf
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$input['email']]);
    if ($stmt->fetch()) {
        resposta_criptografada(
            [
                'success' => false,
                'message' => 'E-mail já cadastrado!',
                'debug' => 'Criptografia na volta: resposta de erro criptografada.'
            ],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM dados_cadastrais WHERE cpf = ?");
    $stmt->execute([$input['cpf']]);
    if ($stmt->fetch()) {
        resposta_criptografada(
            [
                'success' => false,
                'message' => 'CPF já cadastrado!',
                'debug' => 'Criptografia na volta: resposta de erro criptografada.'
            ],
            $aesKey,
            base64_encode($iv)
        );
        exit;
    }

    // Cria o usuário (usuarios)
    $hash_senha = password_hash($input['senha'], PASSWORD_DEFAULT);
    $token = bin2hex(random_bytes(32));

    $stmt = $pdo->prepare("INSERT INTO usuarios (email, senha_modern_hash, ativado, token_ativacao) VALUES (?, ?, 0, ?)");
    $stmt->execute([$input['email'], $hash_senha, $token]);
    $usuario_id = $pdo->lastInsertId();

    // Cria dados cadastrais
    $stmt = $pdo->prepare("INSERT INTO dados_cadastrais 
        (usuario_id, nome, telefone, cpf, data_nascimento, cep, rua, numero, estado, cidade)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $usuario_id,
        $input['nome'],
        $input['telefone'],
        $input['cpf'],
        $input['data_nascimento'],
        $input['cep'],
        $input['rua'],
        $input['numero'],
        $input['estado'],
        $input['cidade']
    ]);

    // ===== Envia o e-mail de ativação =====
    $nome = $input['nome'];
    $email = $input['email'];
    $url_base = $_ENV['URL_BASE'] ?? getenv('URL_BASE') ?? 'http://localhost';
    $link = $url_base . "/php/ativar_conta.php?token=" . $token;


    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = $_ENV['SMTP_HOST'];
        $mail->SMTPAuth = true;
        $mail->Username = $_ENV['SMTP_USER'];
        $mail->Password = $_ENV['SMTP_PASS'];
        $mail->SMTPSecure = 'tls';
        $mail->Port = $_ENV['SMTP_PORT'];
        $mail->setFrom($_ENV['SMTP_FROM'], 'Equipe Livraria');
        $mail->addAddress($email, $nome);
        $mail->isHTML(true);

        $mail->Subject = "Ative sua conta";
        $mail->Body = "
            <h2>Bem-vindo(a), {$nome}!</h2>
            <p>Para ativar sua conta, clique no link abaixo:</p>
            <p><a href='{$link}'>{$link}</a></p>
            <p>Se não foi você, ignore este e-mail.</p>
        ";
        $mail->AltBody = "Bem-vindo(a), {$nome}! Ative sua conta: {$link}";
        $mail->send();
    } catch (Exception $e) {
        error_log("Erro ao enviar e-mail de ativação: " . $mail->ErrorInfo);
        // O cadastro é considerado sucesso mesmo que o e-mail falhe, mas pode tratar diferente se quiser
    }

    resposta_criptografada(
        [
            'success' => true,
            'message' => 'Cadastro realizado com sucesso! Um e-mail de ativação foi enviado.',
            'token_gerado' => $token, // pode tirar em produção
            'debug' => 'Criptografia na volta: esta resposta foi criptografada com a mesma chave AES da ida.'
        ],
        $aesKey,
        base64_encode($iv)
    );
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro no processamento do cadastro.',
        'error' => $e->getMessage()
    ]);
    exit;
}
?>
