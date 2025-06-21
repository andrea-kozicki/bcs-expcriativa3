document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            fetch("/php/logout.php", {
                method: "POST",
                credentials: "include"
            })
                .then(() => {
                    llocalStorage.removeItem("usuario_id");
                    alert("Logout realizado com sucesso.");
                    window.location.href = "/index.html"; // redireciona
                })
                .catch((error) => {
                    console.error("Erro ao sair:", error);
                });
        });
    }
});
