<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once 'config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dados = json_decode(file_get_contents("php://input"), true);

$camposObrigatorios = [
    'nome', 'email', 'senha', 'confirmarSenha',
    'telefone', 'cpf', 'data_nascimento',
    'cep', 'rua', 'numero', 'estado', 'cidade'
];

foreach ($camposObrigatorios as $campo) {
    if (empty($dados[$campo])) {
        http_response_code(400);
        echo json_encode(['erro' => "O campo '$campo' é obrigatório."]);
        exit;
    }
}

if (!filter_var($dados['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['erro' => 'E-mail inválido.']);
    exit;
}

if ($dados['senha'] !== $dados['confirmarSenha']) {
    http_response_code(400);
    echo json_encode(['erro' => 'As senhas não coincidem.']);
    exit;
}

$codigo_ativacao = bin2hex(random_bytes(16));

try {
    $pdo = conectar();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM usuarios WHERE email = :email");
    $stmt->execute([':email' => $dados['email']]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['erro' => 'E-mail já cadastrado.']);
        exit;
    }

   $stmt = $pdo->prepare("INSERT INTO usuarios (email, senha_hash, token_ativacao, ativado) VALUES (:email, :senha_hash, :token_ativacao, :ativado)");

    $stmt->execute([
    ':email' => $dados['email'],
    ':senha_hash' => password_hash($dados['senha'], PASSWORD_DEFAULT),
    ':token_ativacao' => $codigo_ativacao,
    ':ativado' => 0
]);


    $usuario_id = $pdo->lastInsertId();

    $stmt = $pdo->prepare("INSERT INTO dados_cadastrais (usuario_id, nome, telefone, cpf, data_nascimento, cep, rua, numero, estado, cidade)
        VALUES (:usuario_id, :nome, :telefone, :cpf, :data_nascimento, :cep, :rua, :numero, :estado, :cidade)");

    $stmt->execute([
        ':usuario_id' => $usuario_id,
        ':nome' => $dados['nome'],
        ':telefone' => $dados['telefone'],
        ':cpf' => $dados['cpf'],
        ':data_nascimento' => $dados['data_nascimento'],
        ':cep' => $dados['cep'],
        ':rua' => $dados['rua'],
        ':numero' => $dados['numero'],
        ':estado' => $dados['estado'],
        ':cidade' => $dados['cidade']
    ]);

    $url_base = $_ENV['URL_BASE'] ?? 'http://localhost/bcs-expcriativa3';
    $link_ativacao = "$url_base/php/ativar_conta.php?codigo=" . urlencode($codigo_ativacao);

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $_ENV['EMAIL_HOST'];
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['EMAIL_USERNAME'];
    $mail->Password = $_ENV['EMAIL_PASSWORD'];
    $mail->SMTPSecure = 'tls';
    $mail->Port = $_ENV['EMAIL_PORT'];

    $mail->setFrom($_ENV['EMAIL_USERNAME'], 'Confirmação de Cadastro');
    $mail->addAddress($dados['email'], $dados['nome']);
    $mail->Subject = 'Confirmação de Cadastro';
    $mail->isHTML(true);
    $mail->Body = "<p>Olá, <strong>{$dados['nome']}</strong>.</p>
                   <p>Obrigado por se cadastrar! Para ativar sua conta, clique no link abaixo:</p>
                   <p><a href=\"$link_ativacao\">Ativar Conta</a></p>";

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'Cadastro realizado com sucesso. Verifique seu e-mail.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro no banco de dados: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao enviar e-mail: ' . $e->getMessage()]);
}
