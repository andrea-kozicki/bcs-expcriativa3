/**
 * PADRÃO PERFIL.JS
 * Controle de sessão, MFA e interface do perfil
 */
console.log("🟢 padraoperfil.js carregado");

// 1. ESTADO GLOBAL
const appState = {
  dropdowns: { userMenu: false, genresMenu: false },
  session: { userId: null, email: null }
};

// 2. ELEMENTOS DOM
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
    cartCount: document.querySelector('.cart-count')
  };
}

// 3. DROPDOWNS & SIDEBAR
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

// 4. VERIFICAÇÃO DE SESSÃO
async function checkSession() {
  try {
    const sessionUrl = "/php/session_status.php"; // Caminho fixo seguro
    const response = await fetch(sessionUrl, { credentials: 'include' });
    const text = await response.text();

    let dados;
    try {
      dados = JSON.parse(text);
    } catch (e) {
      console.error("❌ Erro ao fazer JSON.parse():", e, "\nResposta recebida:", text);
      window.location.href = "/login2.html";
      return null;
    }

    if (!dados.logged_in) {
      console.warn('🔴 Sessão inválida detectada');
      window.location.href = "/login2.html";
      return null;
    }

    return dados;
  } catch (error) {
    console.error("❌ Erro ao verificar sessão:", error);
    window.location.href = "/login2.html";
    return null;
  }
}

// 5. CONTADOR DE CARRINHO
function updateCartCount(count) {
  const el = getDOMElements();
  if (el.cartCount) {
    el.cartCount.textContent = count;
    el.cartCount.style.display = count > 0 ? 'flex' : 'none';
  }
}

// 6. CONFIGURAR MFA
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

// 7. DESATIVAR MFA
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

// 8. INICIALIZAÇÃO
async function initializeApp() {
  console.debug("🧩 initializeApp() chamado");
  setupDropdownListeners();
  updateCartCount(0);

  const dados = await checkSession();
  console.debug("📦 Dados da sessão:", dados);
  if (!dados) return;

  const emailSpan = document.getElementById('emailUsuario');
  const nomeSpan = document.getElementById('nomeUsuario');
  const saudacao = document.querySelector('.top-list span');

  if (emailSpan) emailSpan.textContent = dados.email;
  if (saudacao) saudacao.textContent = `Olá, ${dados.email}!`;
  if (nomeSpan && dados.nome) nomeSpan.textContent = dados.nome;

  await setupMfaButton();
  setupDesativarMfaButton();
  setupLogoutHandler();

}

// 9. EVENTO DOM READY
document.addEventListener('DOMContentLoaded', () => {
  console.debug("⏱ Aguardando 500ms para iniciar verificação de sessão...");
  setTimeout(initializeApp, 500);
});

// 10. LOGOUT
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
        console.info("🔐 Logout efetuado com sucesso.");
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
