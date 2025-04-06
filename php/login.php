<?php
/**
 * Sistema de Autenticação com MFA (Multi-Factor Authentication)
 * 
 * Este script implementa um sistema de login com autenticação em dois fatores
 * usando Google Authenticator e geração de QR Codes.
 */

// ==============================================
// LOGGING
// ==============================================
ini_set('log_errors', 1);
ini_set('error_log', __DIR__.'/php/php_errors.log');

// ==============================================
// CONFIGURAÇÕES INICIAIS E HEADERS
// ==============================================

// Permite requisições OPTIONS (pré-voo CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verifica o método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Content-Type: application/json");
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Método não permitido. Use POST.'
    ]));
}

// Configuração de sessão segura

ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_lifetime', 86400);
ini_set('session.gc_maxlifetime', 86400);

// Verifique se o diretório de sessão tem permissões de escrita
if (!is_writable(session_save_path())) {
    error_log('Diretório de sessão não tem permissão de escrita: ' . session_save_path());
    die(json_encode(['success' => false, 'message' => 'Erro de configuração do servidor']));
}

// Verifique se o session_start() está no lugar certo
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
session_set_cookie_params([
    'lifetime' => 86400,       // 1 dia
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'],
    'secure' => isset($_SERVER['HTTPS']), // HTTPS se disponível
    'httponly' => true,        // Acessível apenas via HTTP
    'samesite' => 'Lax'        // Proteção contra CSRF
]);


//Verificação da sessão
if (session_status() !== PHP_SESSION_ACTIVE) {
    error_log('Session not active');
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Erro de sessão']));
}


// Headers para CORS e JSON
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? 'http://localhost'));
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400"); // cache preflight por 1 dia

// Configurações de erro (desative em produção)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ==============================================
// CARREGAMENTO DE DEPENDÊNCIAS
// ==============================================

require_once __DIR__.'/../vendor/autoload.php';

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\ImagickImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

// ==============================================
// CONEXÃO COM O BANCO DE DADOS
// ==============================================

try {
    // Configurações do banco de dados (substitua por suas credenciais)
    $dbHost = getenv('DB_HOST') ?: 'localhost';
    $dbName = getenv('DB_NAME') ?: 'testelogin';
    $dbUser = getenv('DB_USER') ?: 'andrea';  // Não use email como usuário
    $dbPass = getenv('DB_PASS') ?: 'v%PtYW5o9@y@c';
    
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName}", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode([
        'success' => false, 
        'message' => 'Erro de conexão com o banco: ' . $e->getMessage()
    ]));
}

// Verificação da estrutura do banco de dados
if (!verificarTabelaUsuarios($pdo)) {
    http_response_code(500);
    die(json_encode([
        'success' => false, 
        'message' => 'Problema na configuração do banco de dados'
    ]));
}

// ==============================================
// GERENCIAMENTO DE TOKENS CSRF
// ==============================================

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

//Timeout para CSRF
// Adicionar na geração do token
$_SESSION['csrf_generated'] = time();

// Na verificação:
if (time() - $_SESSION['csrf_generated'] > 3600) {
    unset($_SESSION['csrf_token']);
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'Token expirado']));
}

// ==============================================
// ROTEAMENTO DE REQUISIÇÕES
// ==============================================

$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    die(json_encode([
        'success' => false, 
        'message' => 'JSON inválido',
        'error' => json_last_error_msg()
    ]));
}

// Verificação de Content-Type
if (empty($_SERVER['CONTENT_TYPE']) || stripos($_SERVER['CONTENT_TYPE'], 'application/json') === false) {
    http_response_code(415);
    die(json_encode([
        'success' => false, 
        'message' => 'Content-Type deve ser application/json'
    ]));
}

// Verificação CSRF
if (empty($input['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $input['csrf_token'])) {
    http_response_code(403);
    die(json_encode([
        'success' => false, 
        'message' => 'Token CSRF inválido'
    ]));
}

if (empty($input['action'])) {
    http_response_code(400);
    die(json_encode([
        'success' => false, 
        'message' => 'Ação não especificada'
    ]));
}

// Processamento das ações
try {
    $google2fa = new Google2FA();
    
    switch ($input['action']) {
        case 'login':
            handleLogin($pdo, $google2fa, $input);
            break;
            
        case 'verify_mfa':
            handleVerifyMfa($pdo, $google2fa, $input);
            break;
            
        case 'setup_mfa':
            handleSetupMfa($pdo, $google2fa, $input);
            break;
            
        case 'confirm_mfa':
            handleConfirmMfa($pdo, $google2fa, $input);
            break;
            
        default:
            http_response_code(400);
            die(json_encode([
                'success' => false, 
                'message' => 'Ação desconhecida'
            ]));
    }
} catch (Exception $e) {
    http_response_code(500);
    die(json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]));
}

// ==============================================
// FUNÇÕES DE TRATAMENTO
// ==============================================

/**
 * Manipula o processo de login
 */
function handleLogin($pdo, $google2fa, $input) {
    $email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $senha = $input['senha'] ?? '';
    
    // Validação do email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Email inválido']));
    }

    //Proteção Bruteforce

    $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
    if ($_SESSION['login_attempts'] > 5) {
        http_response_code(429);
        die(json_encode(['success' => false, 'message' => 'Muitas tentativas. Tente mais tarde.']));
    }

    // Busca usuário no banco de dados
    $stmt = $pdo->prepare("SELECT id, senha_hash, mfa_enabled, mfa_secret FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Verificação de credenciais
    if (!$user || !password_verify($senha, $user['senha_hash'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Credenciais inválidas']));
    }
    
    // Se MFA não estiver ativado, retorna para o frontend configurar
    if (!$user['mfa_enabled']) {
        die(json_encode([
            'success' => true, 
            'mfa_setup_required' => true,
            'user_id' => $user['id'],  // Adicionado user_id
            'email' => $email
        ]));
    }
    
    // Se MFA estiver ativado, gera token para verificação
    $mfa_token = bin2hex(random_bytes(16));
    $_SESSION['mfa_tokens'][$mfa_token] = [
        'user_id' => $user['id'],
        'expires' => time() + 300 // 5 minutos
    ];
    
    die(json_encode([
        'success' => true,
        'mfa_required' => true,
        'mfa_token' => $mfa_token
    ]));
}


/**
 * Verifica o código MFA
 */
function handleVerifyMfa($pdo, $google2fa, $input) {
    $mfa_token = $input['mfa_token'] ?? '';
    $code = $input['code'] ?? '';
    
    // Verifica se o token MFA existe
    if (!isset($_SESSION['mfa_tokens'][$mfa_token])) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Sessão inválida']));
    }
    
    $mfa_data = $_SESSION['mfa_tokens'][$mfa_token];

     // Inicializa contador de tentativas se não existir
     if (!isset($mfa_data['tentativas'])) {
        $mfa_data['tentativas'] = 3;
        $_SESSION['mfa_tokens'][$mfa_token] = $mfa_data;
    }
    
    // Verifica se expirou
    if (time() > $mfa_data['expires']) {
        unset($_SESSION['mfa_tokens'][$mfa_token]);
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Código expirado']));
    }
    
    // Busca segredo MFA do usuário
    $stmt = $pdo->prepare("SELECT mfa_secret FROM usuarios WHERE id = ?");
    $stmt->execute([$mfa_data['user_id']]);
    $user = $stmt->fetch();
    
    if (empty($user['mfa_secret'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Configuração MFA inválida']));
    }
    
    // Verifica o código
    if (!$google2fa->verifyKey($user['mfa_secret'], $code)) {
        $_SESSION['mfa_tokens'][$mfa_token]['tentativas']--;
        
        if ($_SESSION['mfa_tokens'][$mfa_token]['tentativas'] <= 0) {
            unset($_SESSION['mfa_tokens'][$mfa_token]);
            http_response_code(401);
            die(json_encode([
                'success' => false,
                'message' => 'Número máximo de tentativas excedido'
            ]));
        }
        
        http_response_code(401);
        die(json_encode([
            'success' => false,
            'message' => 'Código inválido',
            'tentativas_restantes' => $_SESSION['mfa_tokens'][$mfa_token]['tentativas']
        ]));
    }
    
    // Autenticação bem-sucedida
    $_SESSION['user_id'] = $mfa_data['user_id'];
    unset($_SESSION['mfa_tokens'][$mfa_token]);
    
    die(json_encode([
        'success' => true,
        'redirect' => 'perfil.html'
    ]));
}


/**
 * Configura o MFA para um usuário
 */
function handleSetupMfa($pdo, $google2fa, $input) {
    
    $email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
    
    // Validação mais rigorosa
    if (empty($input['user_id'])) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'ID do usuário não fornecido']));
    }
    
    $user_id = (int)$input['user_id'];

    // Busca usuário no banco de dados
    $stmt = $pdo->prepare("SELECT id, email, mfa_enabled FROM usuarios WHERE id = ? AND email = ?");
    $stmt->execute([$user_id, $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        die(json_encode(['success' => false, 'message' => 'Usuário não encontrado']));
    }
    
    // Se MFA já estiver ativado
    if (!empty($user['mfa_enabled'])) {
        die(json_encode([
            'success' => false, 
            'message' => 'MFA já está ativado para este usuário'
        ]));
    }
    
    // Gera uma chave secreta única
    $secret = $google2fa->generateSecretKey();
    $qrCodeUrl = $google2fa->getQRCodeUrl(
        'Sua Aplicação',  // Nome do serviço
        $user['email'],   // Identificador do usuário
        $secret           // Chave secreta
    );
    
    // Gera a imagem do QR Code
    $renderer = new ImageRenderer(
        new RendererStyle(300),
        new ImagickImageBackEnd()
    );
    $writer = new Writer($renderer);
    $qrCodeImage = 'data:image/png;base64,' . base64_encode($writer->writeString($qrCodeUrl));
    
    // Armazena temporariamente no servidor
    $_SESSION['mfa_setup'] = [
        'user_id' => $user_id,
        'secret' => $secret,
        'expires' => time() + 900 // 15 minutos de validade
    ];
    
    // Retorna os dados para o cliente
    die(json_encode([
        'success' => true,
        'qr_code' => $qrCodeImage,
        'secret' => $secret,
        'user_id' => $user_id, // Adicionado para referência no frontend
        'message' => 'Escaneie o QR Code com seu aplicativo autenticador'
    ]));
}

/**
 * Confirma a ativação do MFA
 */
function handleConfirmMfa($pdo, $google2fa, $input) {
    $code = $input['code'] ?? '';
    $secret = $input['secret'] ?? '';
    $user_id = (int)($input['user_id'] ?? 0);
    
    // Validações básicas
    if (empty($code) || empty($secret) || $user_id <= 0) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Dados inválidos']));
    }
    
    // Verifica se a sessão de setup existe
    if (empty($_SESSION['mfa_setup']) || 
        $_SESSION['mfa_setup']['user_id'] != $user_id ||
        $_SESSION['mfa_setup']['secret'] != $secret) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Sessão inválida']));
    }
    
    $setup_data = $_SESSION['mfa_setup'];
    
    // Verifica se expirou
    if (time() > $setup_data['expires']) {
        unset($_SESSION['mfa_setup']);
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Sessão expirada']));
    }
    
    // Verifica o código
    if (!$google2fa->verifyKey($secret, $code)) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Código inválido']));
    }
    
    // Atualiza o banco de dados
    try {
        $stmt = $pdo->prepare("UPDATE usuarios SET mfa_secret = ?, mfa_enabled = 1 WHERE id = ?");
        $stmt->execute([$secret, $user_id]);
        
        unset($_SESSION['mfa_setup']);
        
        die(json_encode([
            'success' => true,
            'message' => 'MFA ativado com sucesso'
        ]));
    } catch (PDOException $e) {
        error_log("Erro ao ativar MFA: " . $e->getMessage());
        http_response_code(500);
        die(json_encode(['success' => false, 'message' => 'Erro ao ativar MFA']));
    }
}


/**
 * Verifica a estrutura da tabela de usuários
 */
function verificarTabelaUsuarios($pdo) {
    try {
        // Verifica se a tabela existe
        $stmt = $pdo->query("SHOW TABLES LIKE 'usuarios'");
        if ($stmt->rowCount() === 0) {
            throw new Exception("Tabela 'usuarios' não encontrada");
        }
        
        // Verifica colunas necessárias
        $stmt = $pdo->query("DESCRIBE usuarios");
        $colunas = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $colunasNecessarias = ['id', 'email', 'senha_hash', 'mfa_enabled', 'mfa_secret'];
        foreach ($colunasNecessarias as $coluna) {
            if (!in_array($coluna, $colunas)) {
                throw new Exception("Coluna '{$coluna}' não encontrada na tabela 'usuarios'");
            }
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Erro na verificação da tabela: " . $e->getMessage());
        return false;
    }
}

/**
 * Verifica status do MFA
 */
function handleCheckMfaStatus($pdo, $input) {
    $email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
    
    $stmt = $pdo->prepare("SELECT mfa_enabled FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user) {
        die(json_encode([
            'success' => true,
            'mfa_enabled' => (bool)$user['mfa_enabled']
        ]));
    }
    
    die(json_encode(['success' => false]));
}
