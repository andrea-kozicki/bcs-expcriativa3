<?php
session_start();
include_once("config.php");

// Checar se o token foi passado pela URL
if (isset($_GET['token'])) {
    $token = trim($_GET['token']);

    // Sanitizar o token para garantir segurança
    $token = mysqli_real_escape_string($conn, $token);

    // Buscar o usuário com esse token que ainda não está ativo
    $query = "SELECT id FROM usuarios WHERE token_ativacao = ? AND ativo = 0";
    $stmt = mysqli_prepare($conn, $query);
    
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "s", $token);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_store_result($stmt);

        if (mysqli_stmt_num_rows($stmt) > 0) {
            // Token encontrado, ativar o usuário
            mysqli_stmt_bind_result($stmt, $idUsuario);
            mysqli_stmt_fetch($stmt);

            $query_update = "UPDATE usuarios SET ativo = 1, token_ativacao = NULL WHERE id = ?";
            $stmt_update = mysqli_prepare($conn, $query_update);

            if ($stmt_update) {
                mysqli_stmt_bind_param($stmt_update, "i", $idUsuario);
                if (mysqli_stmt_execute($stmt_update)) {
                    echo "<p style='color:green;'>Conta ativada com sucesso! Agora você pode fazer login.</p>";
                } else {
                    echo "<p style='color:red;'>Erro ao ativar a conta. Tente novamente mais tarde.</p>";
                }
                mysqli_stmt_close($stmt_update);
            } else {
                echo "<p style='color:red;'>Erro interno ao preparar a ativação.</p>";
            }

        } else {
            echo "<p style='color:red;'>Token inválido ou conta já ativada.</p>";
        }
        mysqli_stmt_close($stmt);

    } else {
        echo "<p style='color:red;'>Erro interno na verificação do token.</p>";
    }

} else {
    echo "<p style='color:red;'>Token de ativação não fornecido.</p>";
}
?>
