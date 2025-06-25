// js/crypto-utils.js

function strToBuffer(str) {
  return new TextEncoder().encode(str);
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

async function getPublicKey() {
  const res = await fetch('/php/public_key.php');
  const json = await res.json();

  const der = Uint8Array.from(atob(json.publicKey), c => c.charCodeAt(0));

  return window.crypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

async function encryptHybrid(message) {
  console.log("%cCriptografia na ida: os dados foram criptografados antes do envio ao servidor.", "color: green; font-weight: bold;");

  // 1. Gera a chave AES
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-CBC', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Gera IV aleatório
  const iv = window.crypto.getRandomValues(new Uint8Array(16));

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

  if (rawAesKey.byteLength !== 32) {
    throw new Error("❌ AES key inválida (esperado 32 bytes).");
  }

  // 6. Obtém chave pública do servidor
  const publicKey = await getPublicKey();

  // 7. Criptografa a chave AES com RSA
  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP', hash:"SHA-256" },
    publicKey,
    rawAesKey
  );

  // 8. Retorna o payload criptografado + chave AES para descriptografia da volta
  return {
    encryptedKey: bufferToBase64(encryptedKey),
    iv: bufferToBase64(iv),
    encryptedMessage: bufferToBase64(encryptedMessage),
    // Vamos guardar a chave AES para descriptografar a volta!
    _aesKey: aesKey,
    _iv: iv
  };
}

// Função para descriptografar a resposta criptografada do servidor usando a AESKey da ida
async function decryptHybrid(payload, aesKey, iv=null) {
  try {
    // Se vier IV na resposta, use ele, senão, use o mesmo IV da ida
    const responseIv = payload.iv ? base64ToBuffer(payload.iv) : iv;
    const encryptedMsg = base64ToBuffer(payload.encryptedMessage);

    // Descriptografa o conteúdo
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: responseIv },
      aesKey,
      encryptedMsg
    );

    const decoder = new TextDecoder();
    const decryptedStr = decoder.decode(decrypted);

    console.log("%cCriptografia na volta: a resposta do servidor foi recebida criptografada e descriptografada no navegador.", "color: blue; font-weight: bold;");
    return decryptedStr;
  } catch (e) {
    console.error("❌ Erro ao descriptografar resposta híbrida:", e);
    return null;
  }
}
