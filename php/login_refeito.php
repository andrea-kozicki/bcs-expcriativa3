<?php
/**
 * Sistema de Autenticação com MFA - Backend
 * 
 * Principais características:
 * 1. Sessão segura configurada corretamente
 * 2. Proteção CSRF robusta
 * 3. CORS configurado adequadamente
 * 4. Tratamento de erros completo
 * 5. Conexão segura com banco de dados
 */

declare(strict_types=1);

// ==============================================
// 1. CONFIGURAÇÃO INICIAL E SEGURANÇA
// ==============================================

// Configuração de exibição de erros (desativado em produção)
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__.'/logs/php_errors.log');
error_reporting(E_ALL);

// Verificar e criar diretório de logs se necessário
if (!is_dir(__DIR__.'/logs')) {
    if (!mkdir(__DIR__.'/logs', 0755, true)) {
        die('Falha ao criar diretório de logs');
    }
}

// ==============================================
// 2. CONFIGURAÇÃO DE SESSÃO SEGURA
// ==============================================

// Configurações seguras para a sessão
session_name('MFASESSID');
session_set_cookie_params([
    'lifetime' => 0,              // Sessão expira quando o navegador fecha
    'path' => '/',                // Disponível em todo o domínio
    'domain' => '',               // Domínio atual
    'secure' => false,            // Em produção, deve ser true (HTTPS)
    'httponly' => true,           // Acessível apenas via HTTP (não JavaScript)
    'samesite' => 'Lax'           // Proteção contra CSRF
]);

// Iniciar sessão se não estiver ativa
if (session_status() !== PHP_SESSION_ACTIVE) {
    if (!session_start()) {
        die('Falha ao iniciar sessão');
    }
}

// Gerar token CSRF se não existir
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// ==============================================
// 3. CONFIGURAÇÃO DE CORS (Cross-Origin Resource Sharing)
// ==============================================

// Permitir apenas requisições do nosso frontend
header('Access-Control-Allow-Origin: http://127.0.0.1:8080');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Access-Control-Max-Age: 86400');

// Resposta rápida para requisições OPTIONS (pré-voo)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ==============================================
// 4. FUNÇÕES UTILITÁRIAS
// ==============================================

/**
 * Envia uma resposta JSON padronizada
 * @param int $statusCode Código HTTP de status
 * @param array $data Dados a serem enviados como JSON
 */
function sendJsonResponse(int $statusCode, array $data): void {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Verifica se o token CSRF é válido
 * @param string $token Token a ser verificado
 * @return bool True se válido, false caso contrário
 */
function verifyCsrfToken(string $token): bool {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// ==============================================
// 5. CONEXÃO COM BANCO DE DADOS
// ==============================================

/**
 * Obtém uma conexão PDO com o banco de dados
 * @return PDO Objeto de conexão com o banco
 */
function getDatabaseConnection(): PDO {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=localhost;dbname=testelogin;charset=utf8mb4',
                'andrea',
                'v%PtYW5o9@y@c',
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            sendJsonResponse(500, [
                'success' => false,
                'message' => 'Erro no servidor de banco de dados'
            ]);
        }
    }
    
    return $pdo;
}

// ==============================================
// 6. HANDLERS PARA AÇÕES DA API
// ==============================================

/**
 * Manipula a requisição para obter o token CSRF
 */
function handleGetCsrf(): void {
    try {
        // Verificar se a sessão está ativa
        if (session_status() !== PHP_SESSION_ACTIVE) {
            throw new RuntimeException('Sessão não está ativa');
        }
        
        // Verificar se o token CSRF existe
        if (empty($_SESSION['csrf_token'])) {
            throw new RuntimeException('Token CSRF não foi gerado');
        }
        
        // Enviar resposta com o token
        sendJsonResponse(200, [
            'success' => true,
            'token' => $_SESSION['csrf_token']
        ]);
    } catch (Exception $e) {
        error_log("Erro no CSRF: " . $e->getMessage());
        sendJsonResponse(500, [
            'success' => false,
            'message' => 'Falha ao obter token de segurança',
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Manipula o processo de login
 */
function handleLogin(): void {
    // Verificar se os dados foram enviados como JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendJsonResponse(400, ['success' => false, 'message' => 'Dados inválidos']);
    }
    
    // Validar campos obrigatórios
    $requiredFields = ['email', 'senha', 'csrf_token'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            sendJsonResponse(400, ['success' => false, 'message' => 'Campos obrigatórios faltando']);
        }
    }
    
    // Verificar CSRF token
    if (!verifyCsrfToken($data['csrf_token'])) {
        sendJsonResponse(403, ['success' => false, 'message' => 'Token de segurança inválido']);
    }
    
    $pdo = getDatabaseConnection();
    
    try {

        error_log("Tentativa de login para email: " . $data['email']); // Log do email

        // Buscar usuário no banco de dados
        $stmt = $pdo->prepare("SELECT id, email, senha_hash, mfa_enabled FROM usuarios WHERE email = ?");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();
        
        error_log("Usuário encontrado: " . print_r($user, true)); // Log do usuário encontrado

        // Verificar credenciais
        if (!$user) {
            error_log("Usuário não encontrado para email: " . $data['email']);
            sendJsonResponse(401, ['success' => false, 'message' => 'Credenciais inválidas']);
        }
        
        if (!password_verify($data['senha'], $user['senha_hash'])) {
            error_log("Senha inválida para usuário: " . $user['email']);
            sendJsonResponse(401, ['success' => false, 'message' => 'Credenciais inválidas']);
        }
        
        // Atualizar sessão com ID do usuário
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['logged_in'] = true;
        
        // Resposta de sucesso
        sendJsonResponse(200, [
            'success' => true,
            'mfa_required' => (bool)$user['mfa_enabled'],
            'user_id' => $user['id']
        ]);
        
    } catch (PDOException $e) {
        error_log("Erro no banco de dados: " . $e->getMessage());
        sendJsonResponse(500, ['success' => false, 'message' => 'Erro no servidor']);
    }
}

// ==============================================
// 7. ROTEAMENTO PRINCIPAL
// ==============================================

try {
    // Obter ação da query string
    $action = $_GET['action'] ?? '';
    
    // Roteamento baseado na ação
    switch ($action) {
        case 'get_csrf':
            handleGetCsrf();
            break;
            
        case 'login':
            handleLogin();
            break;
            
        default:
            sendJsonResponse(400, ['success' => false, 'message' => 'Ação inválida']);
    }
} catch (Exception $e) {
    error_log("Erro não tratado: " . $e->getMessage());
    sendJsonResponse(500, ['success' => false, 'message' => 'Erro interno no servidor']);
}