/**
 * SISTEMA PRINCIPAL - LIVRARIA
 * com verificação de sessão e exibição do usuário
 */

// 1. ESTADO GLOBAL
const appState = {
    dropdowns: {
        userMenu: false,
        genresMenu: false
    },
    session: {
        userId: null,
        email: null
    }
};

// 2. OBTÉM ELEMENTOS DO DOM
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

// 3. DROPDOWNS
function toggleUserDropdown() {
    const elements = getDOMElements();
    appState.dropdowns.userMenu = !appState.dropdowns.userMenu;

    elements.userDropdown.classList.toggle('active', appState.dropdowns.userMenu);
    if (appState.dropdowns.userMenu) closeOtherDropdowns('user');
}

function toggleGenresDropdown() {
    const elements = getDOMElements();
    appState.dropdowns.genresMenu = !appState.dropdowns.genresMenu;

    elements.genresDropdown.classList.toggle('active', appState.dropdowns.genresMenu);
    elements.dropdownArrow.classList.toggle('rotate', appState.dropdowns.genresMenu);
    if (appState.dropdowns.genresMenu) closeOtherDropdowns('genres');
}

function closeOtherDropdowns(current) {
    if (current !== 'user' && appState.dropdowns.userMenu) toggleUserDropdown();
    if (current !== 'genres' && appState.dropdowns.genresMenu) toggleGenresDropdown();
}

function toggleSidebar() {
    const elements = getDOMElements();
    elements.sidebar.classList.toggle('active');
}

function setupDropdownListeners() {
    const elements = getDOMElements();
    elements.avatar?.addEventListener('click', (e) => { e.stopPropagation(); toggleUserDropdown(); });
    elements.genresBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleGenresDropdown(); });
    elements.barsIcon?.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });

    document.addEventListener('click', () => {
        if (appState.dropdowns.userMenu) toggleUserDropdown();
        if (appState.dropdowns.genresMenu) toggleGenresDropdown();
    });
}

// 4. VERIFICAÇÃO DE SESSÃO
async function checkSession() {
    try {
      const basePath = window.location.pathname.split('/')[1];
      const sessionUrl = `/${basePath}/php/session_status.php`;
  
      const response = await fetch(sessionUrl, { credentials: 'include' });
      const dados = await response.json();
  
      if (!dados.logged_in) {
        console.warn('🔴 Sessão inválida detectada');
        window.location.href = `/${basePath}/login2.html`;
        return null;
      }
  
      return dados;
    } catch (error) {
      console.error("❌ Erro ao verificar sessão:", error);
      const basePath = window.location.pathname.split('/')[1];
      window.location.href = `/${basePath}/login2.html`;
      return null;
    }
}
  
  
// 5. MFA

// Configura o botão de ativação MFA
async function setupMfaButton() {
    const ativarBtn = document.getElementById('ativarMfaBtn');
    const desativarSection = document.querySelector('.mfa-desativar-section');
    const ativarSection = document.querySelector('.mfa-section');
    const statusText = document.getElementById('mfa-status');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
  
    if (!ativarBtn || !statusText || !qrCodeContainer || !desativarSection || !ativarSection) return;
  
    try {
        const basePath = window.location.pathname.split('/')[1];
        const res = await fetch(`/${basePath}/php/session_status.php`, { credentials: 'include' });
        
      const dados = await res.json();
  
      if (dados.mfa_enabled === 0) {
        ativarSection.style.display = 'block';
        desativarSection.style.display = 'none';
        statusText.textContent = 'Clique abaixo para ativar a autenticação por aplicativo.';
  
        ativarBtn.addEventListener('click', async () => {
          const response = await fetch('/bcs-expcriativa3/php/cadastrar_usuario_mfa.php', {
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
            ativarBtn.disabled = true;
            ativarBtn.textContent = 'MFA Ativado';
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
  

  
// 6. CARRINHO
function updateCartCount(count) {
    const elements = getDOMElements();
    if (elements.cartCount) {
        elements.cartCount.textContent = count;
        elements.cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
}


// 7. INICIALIZAÇÃO GERAL
async function initializeApp() {
    console.debug("🧩 initializeApp() chamado");
  
    setupDropdownListeners();
    updateCartCount(0);
  
    const dados = await checkSession();
    console.debug("📦 Dados da sessão:", dados);
  
    if (!dados) {
      console.warn("⚠️ Nenhum dado de sessão encontrado.");
      return;
    }
  
    // Diagnóstico dos campos de sessão
    console.debug("🆔 User ID:", dados.user_id);
    console.debug("📧 Email:", dados.email);
    console.debug("🔐 MFA Enabled:", dados.mfa_enabled);
  
    const emailSpan = document.getElementById('emailUsuario');
    const nomeSpan = document.getElementById('nomeUsuario');
    const saudacao = document.querySelector('.top-list span');
  
    if (emailSpan) emailSpan.textContent = dados.email;
    if (saudacao) saudacao.textContent = `Olá, ${dados.email}!`;
    if (nomeSpan && dados.nome) nomeSpan.textContent = dados.nome;
  
    // Verificar presença dos elementos de MFA
    console.debug("🔍 Verificando DOM:");
    console.debug("mfa-section:", document.querySelector('.mfa-section'));
    console.debug("mfa-desativar-section:", document.querySelector('.mfa-desativar-section'));
    console.debug("ativarMfaBtn:", document.getElementById('ativarMfaBtn'));
    console.debug("desativarMfaBtn:", document.getElementById('desativarMfaBtn'));
  
    // Executar funções de MFA
    await setupMfaButton();
    setupDesativarMfaButton();
  }
  

document.addEventListener('DOMContentLoaded', initializeApp);

//8. DESATIVAÇÃO MFA
function setupDesativarMfaButton() {
    const btn = document.getElementById('desativarMfaBtn');
    if (!btn) return;
  
    btn.addEventListener('click', async () => {
      if (!confirm('Tem certeza que deseja desativar o MFA?')) return;
  
      try {
        const res = await fetch('/bcs-expcriativa3/php/desativar_mfa.php', {
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
  
