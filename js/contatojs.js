const formContato = document.querySelector(".form-adm");
if (formContato) {
    formContato.addEventListener("submit", async function (event) {
        event.preventDefault();

        const nomeEl = document.getElementById("nome");
        const emailEl = document.getElementById("email");
        const assuntoEl = document.getElementById("assunto");
        const mensagemEl = document.getElementById("mensagem");

        const nome = nomeEl ? nomeEl.value.trim() : "";
        const email = emailEl ? emailEl.value.trim() : "";
        const assunto = assuntoEl ? assuntoEl.value : "";
        const mensagem = mensagemEl ? mensagemEl.value.trim() : "";

        console.log("DEBUG - Nome:", nome);
        console.log("DEBUG - Email:", email);
        console.log("DEBUG - Assunto:", assunto);
        console.log("DEBUG - Mensagem:", mensagem);

        let erros = [];

        if (nome.length < 3) {
            erros.push("O nome deve conter pelo menos 3 caracteres.");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            erros.push("Informe um e-mail válido.");
        }

        if (assunto === "Selecione") {
            erros.push("Selecione um assunto válido.");
        }

        if (mensagem.length < 10) {
            erros.push("A mensagem deve conter no mínimo 10 caracteres.");
        }

        if (erros.length > 0) {
            showPopup(erros.join("<br>"), "error");
        } else {
            const dados = { nome, email, assunto, mensagem };
            try {
                const payload = await encryptHybrid(JSON.stringify(dados));

                const response = await fetch("php/enviar_contato.php", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                if (data.success) {
                    showPopup(data.message, "success");
                    formContato.reset();
                } else {
                    showPopup(data.message, "error");
                }
            } catch (error) {
                console.error("Erro ao enviar:", error);
                showPopup("Erro ao enviar a mensagem. Tente novamente.", "error");
            }
        }
    });
}

function showPopup(message, type = "success") {
    const existing = document.querySelector(".popup-message");
    if (existing) existing.remove();

    const popup = document.createElement("div");
    popup.className = `popup-message ${type}`;
    popup.innerHTML = `
        <strong>${type === "success" ? "✅ Sucesso:" : "❌ Erro:"}</strong>
        <p>${message}</p>
    `;

    Object.assign(popup.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: type === "success" ? "#d4edda" : "#f8d7da",
        color: type === "success" ? "#155724" : "#721c24",
        border: "1px solid",
        borderColor: type === "success" ? "#c3e6cb" : "#f5c6cb",
        padding: "12px 20px",
        borderRadius: "5px",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        zIndex: 9999,
        fontFamily: "Arial, sans-serif",
        transition: "opacity 0.5s ease",
    });

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.style.opacity = "0";
        setTimeout(() => popup.remove(), 500);
    }, 5000);
}
