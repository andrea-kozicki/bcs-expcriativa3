<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../phpmailer/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../phpmailer/phpmailer/src/SMTP.php';
require_once __DIR__ . '/../phpmailer/phpmailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Carrega variáveis do .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Conexão com banco
function getDatabaseConnection() {
    $dsn = "mysql:host={$_ENV['DB_HOST']};dbname={$_ENV['DB_NAME']};charset=utf8mb4";
    return new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
}

header('Content-Type: application/json');

try {
    // 1. Dados recebidos
    $nome     = trim($_POST['nome'] ?? '');
    $email    = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $senhaHash = $_POST['senha_hash'] ?? '';
    $salt     = $_POST['salt'] ?? '';
    $telefone = $_POST['telefone'] ?? '';
    $cpf      = $_POST['cpf'] ?? '';
    $cep      = $_POST['cep'] ?? '';
    $rua      = $_POST['rua'] ?? '';
    $numero   = $_POST['numero'] ?? '';
    $estado   = $_POST['estado'] ?? '';
    $cidade   = $_POST['cidade'] ?? '';

    // Formata data
    $dataNascimentoBr = $_POST['data_nascimento'] ?? '';
    $data = DateTime::createFromFormat('d/m/Y', $dataNascimentoBr);
    $data_nascimento = $data ? $data->format('Y-m-d') : null;

    // 2. Validação mínima
    if (!$nome || !$email || !$senhaHash || !$salt || !$data_nascimento) {
        throw new Exception('Erro: Campos obrigatórios estão ausentes ou inválidos.');
    }

    $pdo = getDatabaseConnection();
    $pdo->beginTransaction();

    // 3. Verifica duplicidade
    $check = $pdo->prepare("SELECT COUNT(*) FROM usuarios WHERE email = ?");
    $check->execute([$email]);
    if ($check->fetchColumn() > 0) {
        throw new Exception('Erro: Este e-mail já está cadastrado.');
    }

    // 4. Gera token de ativação
    $token_ativacao = bin2hex(random_bytes(32));

    // 5. Insere usuário
    $stmtUser = $pdo->prepare("
        INSERT INTO usuarios (email, senha_hash, salt, token_ativacao, ativado)
        VALUES (?, ?, ?, ?, 0)
    ");
    $stmtUser->execute([$email, $senhaHash, $salt, $token_ativacao]);
    $usuarioId = $pdo->lastInsertId();

    // 6. Insere dados cadastrais
    $stmtDados = $pdo->prepare("
        INSERT INTO dados_cadastrais (
            usuario_id, nome, telefone, cpf, data_nascimento, cep, rua, numero, estado, cidade
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmtDados->execute([
        $usuarioId, $nome, $telefone, $cpf, $data_nascimento, $cep, $rua, $numero, $estado, $cidade
    ]);

    // 7. Commit
    $pdo->commit();

    // 8. Envia e-mail
    $link = "http://127.0.0.1/bcs-expcriativa3/php/ativar_conta.php?token=$token_ativacao";

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $_ENV['MAIL_HOST'];
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['MAIL_USER'];
    $mail->Password = $_ENV['MAIL_PASS'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $_ENV['MAIL_PORT'];

    $mail->setFrom($_ENV['MAIL_USER'], 'Confirmação de Cadastro');
    $mail->addAddress($email, $nome);
    $mail->isHTML(true);
    $mail->Subject = 'Ative sua conta';
    $mail->Body    = "Olá, $nome!<br>Para ativar sua conta, clique no link:<br><a href='$link'>$link</a>";

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'Cadastro realizado com sucesso! Verifique seu e-mail para ativar a conta.']);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
