document.addEventListener('DOMContentLoaded', () => {

  // ============================
  // 🔹 BLOCO 1: ELEMENTOS & VARIÁVEIS
  // ============================
  const form = document.getElementById("cadastroForm");
  const senhaInput = document.getElementById("senha");
  const senhaHashInput = document.getElementById("senha_hash");
  const confirmarSenhaInput = document.getElementById("confirmarSenha");
  const dataInput = document.getElementById("data_nascimento");
  const telefoneInput = document.getElementById("telefone");
  const cpfInput = document.getElementById("cpf");
  const cepInput = document.getElementById("cep");

  const saltHidden = document.createElement("input");
  saltHidden.type = "hidden";
  saltHidden.name = "salt";
  form.appendChild(saltHidden);

  const regex = {
    nome: /^[a-zA-ZÀ-ÿ\s]{5,}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    senha: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,20}$/,
    telefone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
    cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    cep: /^\d{5}-\d{3}$/,
    numero: /^[a-zA-Z0-9\s]{1,}$/,
    data_nascimento: /^\d{2}\/\d{2}\/\d{4}$/
  };

  const mensagens = {
    nome: "Nome inválido (mínimo 5 letras).",
    email: "Email inválido.",
    senha: "Senha deve ter 12-20 caracteres, uma maiúscula, uma minúscula, número e símbolo.",
    telefone: "Telefone inválido.",
    cpf: "CPF inválido.",
    cep: "CEP inválido.",
    numero: "Número obrigatório.",
    data_nascimento: "Data inválida (formato: dd/mm/aaaa)."
  };

  // ============================
  // 🔹 BLOCO 2: VALIDAÇÃO DE CAMPOS
  // ============================
  function validarCampo(input) {
    const id = input.id;
    const padrao = regex[id];
    const container = input.closest(".column") || input.parentElement;
    const erro = container.querySelector(".mensagem-erro");
    if (!padrao) return true;

    if (!padrao.test(input.value.trim())) {
      input.classList.add("erro");
      if (erro) erro.textContent = mensagens[id] || "Campo inválido";
      return false;
    }

    input.classList.remove("erro");
    if (erro) erro.textContent = "";
    return true;
  }

  document.querySelectorAll("#cadastroForm input[required]").forEach((input) => {
    input.addEventListener("blur", () => validarCampo(input));
    input.addEventListener("input", () => validarCampo(input));
  });

  // ============================
  // 🔹 BLOCO 3: MÁSCARAS
  // ============================
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

  // ============================
  // 🔹 BLOCO 4: AUTO-PREENCHIMENTO VIA CEP
  // ============================
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

  // ============================
  // 🔹 BLOCO 5: REQUISITOS DE SENHA
  // ============================
  const checklist = {
    maiuscula: /[A-Z]/,
    minuscula: /[a-z]/,
    numero: /\d/,
    simbolo: /[@$!%*?&]/,
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

  // ============================
  // 🔹 BLOCO 6: SUBMISSÃO DO FORMULÁRIO
  // ============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (![...form.elements].every(campo => validarCampo(campo))) {
      mostrarPopup(false, "Por favor, corrija os campos inválidos.");
      return;
    }

    if (senhaInput.value !== confirmarSenhaInput.value) {
      mostrarPopup(false, "As senhas não coincidem.");
      return;
    }

    const salt = CryptoJS.lib.WordArray.random(16).toString();
    const senhaHash = CryptoJS.SHA256(senhaInput.value + salt).toString();
    senhaHashInput.value = senhaHash;
    saltHidden.value = salt;

    const dataIso = converterDataParaIso(dataInput.value);

    const dados = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      senha_hash: senhaHash,
      salt: salt,
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
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
      });

      const json = await res.json();

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
      mostrarPopup(false, "Erro na comunicação com o servidor.");
    }
  });

  // ============================
  // 🔹 BLOCO 7: POPUP DE MENSAGEM
  // ============================
  function mostrarPopup(sucesso, mensagem) {
    let popup = document.querySelector(".popup");
    if (!popup) {
      popup = document.createElement("div");
      popup.classList.add("popup");
      document.body.appendChild(popup);
    }
    popup.className = "popup show " + (sucesso ? "success" : "error");
    popup.innerHTML = mensagem;
    setTimeout(() => popup.classList.remove("show"), 5000);
  }

});

// ============================
// 🔹 BLOCO 8: TOGGLE DE SENHA VISÍVEL
// ============================
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
