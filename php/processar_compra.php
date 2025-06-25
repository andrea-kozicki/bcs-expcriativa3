<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once 'cripto_hibrida.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

session_start();
header('Content-Type: application/json');

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_email = $_SESSION['usuario_email'] ?? null;

// --- INÍCIO DO FLUXO CRIPTOGRAFADO ---
$entrada = descriptografarEntrada();
$dados = $entrada['dados'];
$aesKey = $entrada['aesKey'];
$iv = $entrada['iv'];

if (!$usuario_id || !isset($dados['carrinho']) || empty($dados['carrinho'])) {
    resposta_criptografada(
        ["success" => false, "message" => "Dados inválidos.", "debug" => "Criptografia na volta: erro"],
        $aesKey,
        base64_encode($iv)
    );
    exit;
}

$pdo = getDatabaseConnection();

try {
    $pdo->beginTransaction();

    $codigo_pedido = strtoupper(bin2hex(random_bytes(8)));

    $stmt = $pdo->prepare("INSERT INTO pedidos (usuario_id, codigo_pedido) VALUES (?, ?)");
    $stmt->execute([$usuario_id, $codigo_pedido]);

    $stmtLivro = $pdo->prepare("SELECT id, preco, titulo FROM livros WHERE id = ?");
    $stmtCompra = $pdo->prepare("INSERT INTO compras (usuario_id, livro_id, quantidade, preco_unitario, codigo_pedido) VALUES (?, ?, ?, ?, ?)");

    $itens_html = "";
    $total_geral = 0;

    foreach ($dados['carrinho'] as $item) {
        $livro_id = $item['id'];
        $quantidade = $item['quantidade'];

        $stmtLivro->execute([$livro_id]);
        $livro = $stmtLivro->fetch();

        if (!$livro) {
            throw new Exception("Livro com ID $livro_id não encontrado.");
        }

        $preco_unitario = $livro['preco'];
        $titulo = htmlspecialchars($livro['titulo']);
        $subtotal = $preco_unitario * $quantidade;
        $total_geral += $subtotal;

        $stmtCompra->execute([
            $usuario_id,
            $livro_id,
            $quantidade,
            $preco_unitario,
            $codigo_pedido
        ]);

        $itens_html .= "<tr>
            <td>{$titulo}</td>
            <td>{$quantidade}</td>
            <td>R$ " . number_format($preco_unitario, 2, ',', '.') . "</td>
            <td>R$ " . number_format($subtotal, 2, ',', '.') . "</td>
        </tr>";
    }

    $pdo->commit();

    // Enviar e-mail de confirmação
    if ($usuario_email) {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = $_ENV['SMTP_HOST'];
            $mail->SMTPAuth = true;
            $mail->Username = $_ENV['SMTP_USER'];
            $mail->Password = $_ENV['SMTP_PASS'];
            $mail->SMTPSecure = 'tls';
            $mail->Port = 587;

            $mail->setFrom($_ENV['SMTP_FROM'], 'Livraria');
            $mail->addAddress($usuario_email);

            $mail->isHTML(true);
            $mail->Subject = 'Confirmação do Pedido #' . $codigo_pedido;

            $mail->Body = "
                <h2>Obrigado por sua compra!</h2>
                <p>Seu pedido <strong>{$codigo_pedido}</strong> foi registrado com sucesso.</p>
                <table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse; width: 100%;'>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Qtd</th>
                            <th>Preço Unitário</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$itens_html}
                        <tr>
                            <td colspan='3' style='text-align: right;'><strong>Total Geral:</strong></td>
                            <td><strong>R$ " . number_format($total_geral, 2, ',', '.') . "</strong></td>
                        </tr>
                    </tbody>
                </table>
                <p>Em breve, você receberá mais informações sobre a entrega.</p>
            ";

            $mail->send();
        } catch (Exception $e) {
            error_log("Erro ao enviar e-mail: " . $mail->ErrorInfo);
        }
    }

    resposta_criptografada(
        ["success" => true, "codigo_pedido" => $codigo_pedido, "debug" => "Criptografia na volta: sucesso"],
        $aesKey,
        base64_encode($iv)
    );

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    resposta_criptografada(
        ["success" => false, "message" => $e->getMessage(), "debug" => "Criptografia na volta: erro"],
        $aesKey,
        base64_encode($iv)
    );
}
?>
