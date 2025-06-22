// public_key_der.php
<?php
$publicKeyPath = __DIR__ . '/../keys/public.pem';
$key = file_get_contents($publicKeyPath);
$clean = preg_replace('/-----.*KEY-----|\s/', '', $key);
echo $clean; // Base64 DER limpa
