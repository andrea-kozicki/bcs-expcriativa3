<?php
session_start();
session_unset();
session_destroy();

// Redireciona para a página de login
header('Location: /login.html');
exit;
