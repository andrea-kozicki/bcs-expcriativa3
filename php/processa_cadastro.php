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

    // === Lógica de cadastro ===
    $campos = ['nome', 'email', 'senha', 'telefone', 'cpf', 'data_nascimento', 'cep', 'rua', 'numero', 'estado', 'cidade'];
    foreach ($campos as $campo) {
        if (empty($input[$campo])) {
            $resposta = [
                'success' => false,
                'message' => "Campo obrigatório ausente: $campo",
                'debug' => 'Criptografia na volta: resposta de erro criptografada.'
            ];
            resposta_criptografada($resposta, $aes_key, $data['iv']);
        }
    }

    $pdo = getDatabaseConnection();

    // Verifica se já existe email ou cpf
    $stmt = $pdo->prepare("SELECT id FROM usuario WHERE email = :email OR cpf = :cpf");
    $stmt->execute([
        ':email' => $input['email'],
        ':cpf' => $input['cpf']
    ]);
    if ($stmt->fetch()) {
        $resposta = [
            'success' => false,
            'message' => 'E-mail ou CPF já cadastrado!',
            'debug' => 'Criptografia na volta: resposta de erro criptografada.'
        ];
        resposta_criptografada($resposta, $aes_key, $data['iv']);
    }

    $hash_senha = password_hash($input['senha'], PASSWORD_DEFAULT);

    // Insere usuário
    $stmt = $pdo->prepare("
        INSERT INTO usuario 
            (nome, email, senha, telefone, cpf, data_nascimento, cep, rua, numero, estado, cidade, ativo) 
        VALUES 
            (:nome, :email, :senha, :telefone, :cpf, :data_nascimento, :cep, :rua, :numero, :estado, :cidade, 0)
    ");
    $sucesso = $stmt->execute([
        ':nome' => $input['nome'],
        ':email' => $input['email'],
        ':senha' => $hash_senha,
        ':telefone' => $input['telefone'],
        ':cpf' => $input['cpf'],
        ':data_nascimento' => $input['data_nascimento'],
        ':cep' => $input['cep'],
        ':rua' => $input['rua'],
        ':numero' => $input['numero'],
        ':estado' => $input['estado'],
        ':cidade' => $input['cidade']
    ]);
    if (!$sucesso) {
        $resposta = [
            'success' => false,
            'message' => 'Erro ao cadastrar usuário!',
            'debug' => 'Criptografia na volta: resposta de erro criptografada.'
        ];
        resposta_criptografada($resposta, $aes_key, $data['iv']);
    }

    $id_usuario = $pdo->lastInsertId();

    // === Geração e salvamento do token de ativação ===
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare("INSERT INTO token_ativacao (id_usuario, token, criado_em, utilizado) VALUES (:id_usuario, :token, NOW(), 0)");
    $stmt->execute([
        ':id_usuario' => $id_usuario,
        ':token' => $token
    ]);

    $resposta = [
        'success' => true,
        'message' => 'Cadastro realizado com sucesso! Um e-mail de ativação será enviado.',
        'token_gerado' => $token, // Pode omitir em produção, mas útil para debug/banca
        'debug' => 'Criptografia na volta: esta resposta foi criptografada com a mesma chave AES da ida.'
    ];
    resposta_criptografada($resposta, $aes_key, $data['iv']);

} catch (Exception $e) {
    $resposta = [
        'success' => false,
        'message' => 'Erro no processamento do cadastro.',
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
