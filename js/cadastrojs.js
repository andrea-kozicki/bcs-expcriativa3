document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("cadastroForm");
  const senhaInput = document.getElementById("senha");
  const confirmarSenhaInput = document.getElementById("confirmarSenha");
  const dataInput = document.getElementById("data_nascimento");
  const telefoneInput = document.getElementById("telefone");
  const cpfInput = document.getElementById("cpf");
  const cepInput = document.getElementById("cep");

  console.debug("🔍 Formulário de cadastro carregado.");

  const regex = {
    nome: /^[a-zA-ZÀ-ÿ\s]{5,}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    senha: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,20}$/,
    telefone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
    cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    cep: /^\d{5}-\d{3}$/,
    numero: /^[a-zA-Z0-9\s]{1,}$/,
    data_nascimento: /^\d{2}\/\d{2}\/\d{4}$/,
    rua: /^.{2,}$/,
    estado: /^[A-Z]{2}$/,
    cidade: /^[a-zA-ZÀ-ÿ\s]{2,}$/
  };

  const mensagens = {
    nome: "Nome inválido (mínimo 5 letras).",
    email: "Email inválido.",
    senha: "Senha deve ter 12-20 caracteres, com maiúscula, minúscula, número e símbolo.",
    telefone: "Telefone inválido.",
    cpf: "CPF inválido.",
    cep: "CEP inválido.",
    numero: "Número obrigatório.",
    data_nascimento: "Data inválida (formato: dd/mm/aaaa).",
    rua: "Rua obrigatória.",
    estado: "Estado inválido.",
    cidade: "Cidade inválida."
  };

  function validarCampo(input, mostrarErro = true) {
    const id = input.id || input.name;
    const padrao = regex[id];
    const container = input.closest(".column") || input.parentElement;
    const erro = container.querySelector(".mensagem-erro");
    const valor = input.value.trim();

    console.debug(`📌 Validando campo [${id}]: valor='${valor}'`);

    if (!padrao) {
      console.debug(`ℹ️ Sem regex definida para [${id}].`);
      return true;
    }

    const valido = padrao.test(valor);
    console.debug(`🔍 Regex para [${id}]:`, padrao, "→ Resultado:", valido);

    if (!valido) {
      input.classList.add("erro");
      if (erro && mostrarErro) erro.textContent = mensagens[id] || "Campo inválido";
      if (mostrarErro) console.warn(`❌ Campo inválido [${id}]:`, valor);
      return false;
    }

    input.classList.remove("erro");
    if (erro) erro.textContent = "";
    console.debug(`✅ Campo válido [${id}]`);
    return true;
  }

  document.querySelectorAll("#cadastroForm input[required]").forEach((input) => {
    input.addEventListener("blur", () => validarCampo(input, true));
    input.addEventListener("input", () => validarCampo(input, false));
    input.addEventListener("paste", () => {
      setTimeout(() => {
        input.value = input.value.trim();
        validarCampo(input, false);
      }, 0);
    });
  });

  cpfInput.addEventListener("input", (e) => {
    e.target.value = e.target.value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  });

  telefoneInput.addEventListener("input", (e) => {
    e.target.value = e.target.value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})$/, "$1-$2");
  });

  cepInput.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 5) {
      valor = valor.replace(/^(\d{5})(\d{0,3}).*/, "$1-$2");
    }
    e.target.value = valor;
  });

  dataInput.addEventListener("input", () => {
    let valor = dataInput.value.replace(/\D/g, "").slice(0, 8);
    valor = valor.replace(/(\d{2})(\d)/, "$1/$2");
    valor = valor.replace(/(\d{2})(\d)/, "$1/$2");
    dataInput.value = valor;
  });

  function converterDataParaIso(dataBr) {
    const partes = dataBr.split("/");
    if (partes.length !== 3) return "";
    const [dia, mes, ano] = partes;
    return `${ano}-${mes}-${dia}`;
  }

  cepInput.addEventListener("blur", async () => {
    const cep = cepInput.value.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = await res.json();
      if (!dados.erro) {
        document.getElementById("rua").value = dados.logradouro || "";
        document.getElementById("estado").value = dados.uf || "";
        document.getElementById("cidade").value = dados.localidade || "";
      }
    } catch (err) {
      console.warn("Erro ao buscar o CEP:", err);
    }
  });

  const checklist = {
    maiuscula: /[A-Z]/,
    minuscula: /[a-z]/,
    numero: /\d/,
    simbolo: /[^a-zA-Z\d]/,
    tamanho: /.{12,20}/
  };

  const checklistItems = {
    maiuscula: document.getElementById("check-maiuscula"),
    minuscula: document.getElementById("check-minuscula"),
    numero: document.getElementById("check-numero"),
    simbolo: document.getElementById("check-simbolo"),
    tamanho: document.getElementById("check-tamanho")
  };

  const strengthBar = document.querySelector(".password-strength-bar");
  const strengthLevel = document.querySelector(".strength-level");
  const charCount = document.querySelector(".char-count");

  senhaInput.addEventListener("input", () => {
    const val = senhaInput.value;
    let score = 0;
    Object.keys(checklist).forEach(key => {
      const passed = checklist[key].test(val);
      if (checklistItems[key]) {
        checklistItems[key].classList.toggle("passed", passed);
      }
      if (passed) score++;
    });

    const levels = ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];
    const classes = ["very-weak", "weak", "medium", "strong", "very-strong"];
    strengthBar.className = "password-strength-bar " + classes[Math.min(score, 4)];
    strengthLevel.textContent = levels[Math.min(score, 4)];
    charCount.textContent = val.length;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.debug("🚀 Submissão do formulário iniciada");

    const camposObrigatorios = [...form.querySelectorAll("input[required]")];
    if (!camposObrigatorios.every(campo => validarCampo(campo, true))) {
      mostrarPopup(false, "Por favor, corrija os campos inválidos.");
      return;
    }
    if (senhaInput.value !== confirmarSenhaInput.value) {
      mostrarPopup(false, "As senhas não coincidem.");
      return;
    }

    const dataIso = converterDataParaIso(dataInput.value);

    const dados = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      senha: senhaInput.value,
      telefone: form.telefone.value.trim(),
      cpf: form.cpf.value.trim(),
      data_nascimento: dataIso,
      cep: form.cep.value.trim(),
      rua: form.rua.value.trim(),
      numero: form.numero.value.trim(),
      estado: form.estado.value.trim(),
      cidade: form.cidade.value.trim()
    };

    try {
      // Criptografa dados antes do envio (IDA)
      const payload = await encryptHybrid(JSON.stringify(dados));

      // Mensagem visual e console para "ida"
      mostrarPopup(true, "🟢 Criptografia na ida: os dados foram criptografados antes do envio ao servidor.");
      // Remove popup após 3 segundos
      setTimeout(() => { document.querySelector(".popup").classList.remove("show"); }, 3000);

      // Prepara envio (não envia _aesKey e _iv!)
      const { encryptedKey, iv, encryptedMessage } = payload;

      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedKey, iv, encryptedMessage }),
        credentials: "include"
      });

      // Recebe resposta criptografada do servidor
      const encryptedResponse = await res.json();

      // Descriptografa resposta usando a chave AES original
      const decryptedJson = await decryptHybrid(encryptedResponse, payload._aesKey, payload._iv);

      // Mensagem visual e console para "volta"
      mostrarPopup(true, "🔵 Criptografia na volta: a resposta do servidor foi recebida criptografada e descriptografada no navegador.");
      setTimeout(() => { document.querySelector(".popup").classList.remove("show"); }, 3500);

      // Interpreta a resposta descriptografada
      let json;
      try {
        json = JSON.parse(decryptedJson);
      } catch (parseErr) {
        mostrarPopup(false, "Erro ao interpretar resposta do servidor.");
        return;
      }

      if (!res.ok || !json.success) {
        mostrarPopup(false, json.message || "Erro no cadastro.");
        return;
      }

      mostrarPopup(true, json.message || "Cadastro realizado com sucesso!");
      form.reset();

      setTimeout(() => {
        window.location.href = "/login2.html";
      }, 3000);

    } catch (err) {
      console.error("❌ Erro durante o envio do formulário:", err);
      mostrarPopup(false, "Erro na comunicação com o servidor.");
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("cadastroForm");
  const senhaInput = document.getElementById("senha");
  const confirmarSenhaInput = document.getElementById("confirmarSenha");
  const dataInput = document.getElementById("data_nascimento");
  const telefoneInput = document.getElementById("telefone");
  const cpfInput = document.getElementById("cpf");
  const cepInput = document.getElementById("cep");

  // ... [Restante do código de validação continua igual]

  // AQUI COMEÇA O FLUXO DE ENVIO DO FORMULÁRIO

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.debug("🚀 Submissão do formulário iniciada");

    const camposObrigatorios = [...form.querySelectorAll("input[required]")];
    if (!camposObrigatorios.every(campo => validarCampo(campo, true))) {
      mostrarPopup(false, "Por favor, corrija os campos inválidos.");
      return;
    }
    if (senhaInput.value !== confirmarSenhaInput.value) {
      mostrarPopup(false, "As senhas não coincidem.");
      return;
    }

    const dataIso = converterDataParaIso(dataInput.value);

    const dados = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      senha: senhaInput.value,
      telefone: form.telefone.value.trim(),
      cpf: form.cpf.value.trim(),
      data_nascimento: dataIso,
      cep: form.cep.value.trim(),
      rua: form.rua.value.trim(),
      numero: form.numero.value.trim(),
      estado: form.estado.value.trim(),
      cidade: form.cidade.value.trim()
    };

    try {
      // Criptografa dados antes do envio (IDA)
      const payload = await encryptHybrid(JSON.stringify(dados));

      // Mensagem visual e console para "ida"
      mostrarPopup(true, "🟢 Criptografia na ida: os dados foram criptografados antes do envio ao servidor.");
      // Remove popup após 3 segundos
      setTimeout(() => { document.querySelector(".popup").classList.remove("show"); }, 3000);

      // Prepara envio (não envia _aesKey e _iv!)
      const { encryptedKey, iv, encryptedMessage } = payload;

      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedKey, iv, encryptedMessage }),
        credentials: "include"
      });

      // Recebe resposta criptografada do servidor
      const encryptedResponse = await res.json();

      // Descriptografa resposta usando a chave AES original
      const decryptedJson = await decryptHybrid(encryptedResponse, payload._aesKey, payload._iv);

      // Mensagem visual e console para "volta"
      mostrarPopup(true, "🔵 Criptografia na volta: a resposta do servidor foi recebida criptografada e descriptografada no navegador.");
      setTimeout(() => { document.querySelector(".popup").classList.remove("show"); }, 3500);

      // Interpreta a resposta descriptografada
      let json;
      try {
        json = JSON.parse(decryptedJson);
      } catch (parseErr) {
        mostrarPopup(false, "Erro ao interpretar resposta do servidor.");
        return;
      }

      if (!res.ok || !json.success) {
        mostrarPopup(false, json.message || "Erro no cadastro.");
        return;
      }

      mostrarPopup(true, json.message || "Cadastro realizado com sucesso!");
      form.reset();

      setTimeout(() => {
        window.location.href = "/login2.html";
      }, 3000);

    } catch (err) {
      console.error("❌ Erro durante o envio do formulário:", err);
      mostrarPopup(false, "Erro na comunicação com o servidor.");
    }
  });

  // ... [Restante das funções de validação, UI, etc.]

  function mostrarPopup(sucesso, mensagem) {
    let popup = document.querySelector(".popup");
    if (!popup) {
      popup = document.createElement("div");
      popup.classList.add("popup");
      document.body.appendChild(popup);
    }
    popup.className = "popup show " + (sucesso ? "success" : "error");
    popup.innerHTML = mensagem;

    // Destaque visual para ida (verde) e volta (azul)
    if (mensagem.includes("ida")) popup.style.background = "#2ecc40";
    else if (mensagem.includes("volta")) popup.style.background = "#0074d9";
    else popup.style.background = sucesso ? "#2ecc40" : "#ff4136";
  }
});


document.querySelectorAll(".toggle-password").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = btn.dataset.target;
    const campoSenha = document.getElementById(targetId);
    const icone = btn.querySelector("i");

    if (campoSenha.type === "password") {
      campoSenha.type = "text";
      icone.classList.remove("fa-eye");
      icone.classList.add("fa-eye-slash");
    } else {
      campoSenha.type = "password";
      icone.classList.remove("fa-eye-slash");
      icone.classList.add("fa-eye");
    }
  });
});
})
