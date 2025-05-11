<?php
function getDatabaseConnection(): PDO {
    return new PDO('mysql:host=localhost;dbname=login;charset=utf8mb4', 'andrea', 'v%PtYW5o9@y@c', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
}
