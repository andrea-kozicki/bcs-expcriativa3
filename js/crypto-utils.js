// js/crypto-utils.js

// Função utilitária para converter string para ArrayBuffer
function strToBuffer(str) {
  return new TextEncoder().encode(str);
}

// Função utilitária para converter ArrayBuffer para base64
function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Função para obter chave pública do servidor
async function getPublicKey() {
  const res = await fetch('/php/public_key.php');
  const json = await res.json();
  return window.crypto.subtle.importKey(
    'spki',
    strToBuffer(atob(json.publicKey.replace(/-----[^\n]+-----|\n/g, ''))),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

// Função principal para criptografia híbrida
async function encryptHybrid(message) {
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-CBC',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const encodedMessage = strToBuffer(message);
  const encryptedMessage = await window.crypto.subtle.encrypt(
    {
      name: 'AES-CBC',
      iv: iv,
    },
    aesKey,
    encodedMessage
  );

  const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
  const publicKey = await getPublicKey();
  const encryptedKey = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    publicKey,
    rawAesKey
  );

  return {
    encryptedKey: bufferToBase64(encryptedKey),
    iv: bufferToBase64(iv),
    encryptedMessage: bufferToBase64(encryptedMessage)
  };
}