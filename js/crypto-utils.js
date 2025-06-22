// js/crypto-utils.js

function strToBuffer(str) {
  return new TextEncoder().encode(str);
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

async function getPublicKey() {
  const res = await fetch('/php/public_key.php');
  const json = await res.json();

  const pem = json.publicKey
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '');

  const binaryDer = Uint8Array.from(atob(pem), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'spki',
    binaryDer.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  );
}



async function encryptHybrid(message) {
  console.log("🔐 Iniciando criptografia híbrida...");

  // 1. Gera a chave AES
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-CBC', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Gera IV aleatório
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  console.log("🔐 IV gerado (16 bytes):", iv);

  // 3. Codifica a mensagem como ArrayBuffer
  const encodedMessage = strToBuffer(message);

  // 4. Criptografa a mensagem com AES
  const encryptedMessage = await window.crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    encodedMessage
  );

  // 5. Exporta a chave AES em formato raw
  const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
  console.log("🔐 AES key (byte length):", rawAesKey.byteLength);
  console.log("🔐 AES key (bytes):", new Uint8Array(rawAesKey));

  if (rawAesKey.byteLength !== 32) {
    throw new Error("❌ AES key inválida (esperado 32 bytes).");
  }

  // 6. Obtém chave pública do servidor
  const publicKey = await getPublicKey();

  // 7. Criptografa a chave AES com RSA
  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawAesKey
  );

  // 8. Retorna o payload criptografado
  return {
    encryptedKey: bufferToBase64(encryptedKey),
    iv: bufferToBase64(iv),
    encryptedMessage: bufferToBase64(encryptedMessage)
  };
}
