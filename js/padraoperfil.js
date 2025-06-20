/**
 * PADRÃO PERFIL.JS
 * Controle de sessão, MFA, interface do perfil e pedidos
 */
console.log("🟢 padraoperfil.js carregado");

// === 1. ESTADO GLOBAL ===
const appState = {
  dropdowns: { userMenu: false, genresMenu: false },
  session: { userId: null, email: null }
};

// === 2. ELEMENTOS DOM ===
function getDOMElements() {
  return {
    avatar: document.querySelector('.avatar'),
    userDropdown: document.querySelector('.dropdown-menu.setting'),
    genresBtn: document.querySelector('.dropdown-btn'),
    genresDropdown: document.querySelector('.dropdown-container'),
    dropdownArrow: document.querySelector('.dropdown-btn .fa-caret-down'),
    sidebar: document.querySelector('.sidebar'),
    barsIcon: document.querySelector('.fa-bars'),
    userGreeting: document.querySelector('.top-list span'),
    cartCount: document.querySelector('.cart-count'),
    emailSpan: document.getElementById('emailUsuario'),
    nomeSpan: document.getElementById('nomeUsuario')
  };
}

// === 3. DROPDOWNS & SIDEBAR ===
function toggleUserDropdown() {
  const el = getDOMElements();
  appState.dropdowns.userMenu = !appState.dropdowns.userMenu;
  el.userDropdown.classList.toggle('active', appState.dropdowns.userMenu);
  if (appState.dropdowns.userMenu) closeOtherDropdowns('user');
}

function toggleGenresDropdown() {
  const el = getDOMElements();
  appState.dropdowns.genresMenu = !appState.dropdowns.genresMenu;
  el.genresDropdown.classList.toggle('active', appState.dropdowns.genresMenu);
  el.dropdownArrow.classList.toggle('rotate', appState.dropdowns.genresMenu);
  if (appState.dropdowns.genresMenu) closeOtherDropdowns('genres');
}

function closeOtherDropdowns(current) {
  if (current !== 'user' && appState.dropdowns.userMenu) toggleUserDropdown();
  if (current !== 'genres' && appState.dropdowns.genresMenu) toggleGenresDropdown();
}

function toggleSidebar() {
  const el = getDOMElements();
  el.sidebar.classList.toggle('active');
}

function setupDropdownListeners() {
  const el = getDOMElements();
  el.avatar?.addEventListener('click', (e) => { e.stopPropagation(); toggleUserDropdown(); });
  el.genresBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleGenresDropdown(); });
  el.barsIcon?.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
  document.addEventListener('click', () => {
    if (appState.dropdowns.userMenu) toggleUserDropdown();
    if (appState.dropdowns.genresMenu) toggleGenresDropdown();
  });
}

// === 4. VERIFICAÇÃO DE SESSÃO ===
async function checkSession() {
  try {
    const sessionUrl = "/php/session_status.php";
    const response = await fetch(sessionUrl, { credentials: 'include' });
    const text = await response.text();

    let dados;
    try {
      dados = JSON.parse(text);
    } catch (e) {
      console.error("Erro ao fazer JSON.parse():", e, "\nResposta recebida:", text);
      window.location.href = "/login2.html";
      return null;
    }

    if (!dados.logged_in) {
      console.warn('Sessão inválida detectada');
      window.location.href = "/login2.html";
      return null;
    }

    return dados;
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "/login2.html";
    return null;
  }
}


// === 6. MFA ===
async function setupMfaButton() {
  const btn = document.getElementById('ativarMfaBtn');
  const desativarSection = document.querySelector('.mfa-desativar-section');
  const ativarSection = document.querySelector('.mfa-section');
  const statusText = document.getElementById('mfa-status');
  const qrCodeContainer = document.getElementById('qrCodeContainer');

  if (!btn || !statusText || !qrCodeContainer || !desativarSection || !ativarSection) return;

  try {
    const res = await fetch("/php/session_status.php", { credentials: 'include' });
    const dados = await res.json();

    if (dados.mfa_enabled === 0) {
      ativarSection.style.display = 'block';
      desativarSection.style.display = 'none';
      statusText.textContent = 'Clique abaixo para ativar a autenticação por aplicativo.';

      btn.addEventListener('click', async () => {
        const response = await fetch('/php/cadastrar_usuario_mfa.php', {
          method: 'POST',
          credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
          qrCodeContainer.innerHTML = `
            <p>Escaneie este QR Code com seu aplicativo autenticador:</p>
            <img src="${data.qr_code_url}" alt="QR Code MFA" style="max-width: 200px; margin: 10px 0;">
            <p><strong>Chave manual:</strong> ${data.secret}</p>
          `;
          qrCodeContainer.style.display = 'block';
          btn.disabled = true;
          btn.textContent = 'MFA Ativado';
        } else {
          alert(data.message || 'Erro ao ativar MFA.');
        }
      });
    } else {
      ativarSection.style.display = 'none';
      desativarSection.style.display = 'block';
    }
  } catch (err) {
    console.error('Erro ao configurar MFA:', err);
  }
}

function setupDesativarMfaButton() {
  const btn = document.getElementById('desativarMfaBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja desativar o MFA?')) return;

    try {
      const res = await fetch('/php/desativar_mfa.php', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();
      if (data.success) {
        alert('MFA desativado com sucesso. Recarregue a página para ver o botão de ativar novamente.');
        location.reload();
      } else {
        alert(data.message || 'Erro ao desativar MFA.');
      }
    } catch (error) {
      console.error('Erro ao desativar MFA:', error);
      alert('Erro inesperado ao desativar MFA.');
    }
  });
}

// === 7. PEDIDOS ===
function carregarPedidos() {
  const container = document.getElementById("lista-pedidos");
  if (!container) return;
  container.textContent = "Carregando...";

  fetch("php/listar_pedidos.php", {
    credentials: "include"
  })
    .then(response => response.json())
    .then(pedidos => {
      container.innerHTML = "";

      if (!pedidos || pedidos.length === 0) {
        container.textContent = "⚠️ Nenhum pedido encontrado.";
        return;
      }

      pedidos.forEach(p => {
        const pedidoCard = document.createElement("div");
        pedidoCard.className = "pedido-card";
        pedidoCard.style.marginBottom = "1.5rem";
        pedidoCard.style.border = "1px solid #ccc";
        pedidoCard.style.padding = "1rem";
        pedidoCard.style.borderRadius = "8px";

        const header = document.createElement("div");
        const codigo = p.codigo_pedido || "???";
        const data = p.data || "Data não informada";
        const total = p.total || "R$ 0,00";

        header.innerHTML = `
          <strong>Pedido ${codigo}</strong><br>
          Data: ${data} | Total: ${total}<br>
          <button class="btn btn-secondary ver-detalhes-btn" data-codigo="${codigo}" style="margin-top: 0.5rem;">Ver Detalhes</button>
        `;

        const detalhesDiv = document.createElement("div");
        detalhesDiv.className = "detalhes-pedido";
        detalhesDiv.style.display = "none";
        detalhesDiv.style.marginTop = "1rem";
        detalhesDiv.textContent = "Carregando detalhes...";

        header.querySelector(".ver-detalhes-btn").addEventListener("click", function () {
          const isVisible = detalhesDiv.style.display === "block";
          if (isVisible) {
            detalhesDiv.style.display = "none";
            return;
          }

          detalhesDiv.style.display = "block";

          fetch(`php/listar_detalhes_pedido.php?codigo=${codigo}`, {
            credentials: "include"
          })
            .then(res => res.json())
            .then(dados => {
              if (!dados.itens || dados.itens.length === 0) {
                detalhesDiv.textContent = "Este pedido não possui itens.";
                return;
              }

              const ul = document.createElement("ul");
              dados.itens.forEach(item => {
                const li = document.createElement("li");
                li.textContent = `${item.titulo} - ${item.quantidade}x ${item.preco}`;
                ul.appendChild(li);
              });

              detalhesDiv.innerHTML = "";
              detalhesDiv.appendChild(ul);
            })
            .catch(() => {
              detalhesDiv.textContent = "Erro ao carregar detalhes.";
            });
        });

        pedidoCard.appendChild(header);
        pedidoCard.appendChild(detalhesDiv);
        container.appendChild(pedidoCard);
      });
    })
    .catch(error => {
      console.error("Erro ao carregar pedidos:", error);
      container.textContent = "Erro ao carregar pedidos.";
    });
}


// === 8. LOGOUT ===
function setupLogoutHandler() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/php/logout.php', {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        console.info("Logout efetuado com sucesso.");
        window.location.href = '/login2.html';
      } else {
        alert('Erro ao tentar sair. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro durante logout:', err);
      alert('Erro inesperado ao sair.');
    }
  });
}

// === 9. INICIALIZAÇÃO ===
async function initializeApp() {
  setupDropdownListeners();
  

  const dados = await checkSession();
  if (!dados) return;

  const el = getDOMElements();
  if (el.emailSpan) el.emailSpan.textContent = dados.email;
  if (el.userGreeting) el.userGreeting.textContent = `Olá, ${dados.email}!`;
  if (el.nomeSpan && dados.nome) el.nomeSpan.textContent = dados.nome;

  await setupMfaButton();
  setupDesativarMfaButton();
  setupLogoutHandler();
}

// === 10. DOM READY ===
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(initializeApp, 500);

  if (window.location.hash === "#meus-pedidos") {
    const secao = document.getElementById("meus-pedidos");
    secao?.scrollIntoView({ behavior: "smooth" });
  }

  carregarPedidos();
});
