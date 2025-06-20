document.addEventListener("DOMContentLoaded", function () {
  // ========== REFERÊNCIAS ==========
 
  const voltarBtn = document.getElementById("voltarBtn");

  
  // ========== VOLTAR ==========
  if (voltarBtn) {
    voltarBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  // ========== AVATAR MENU ==========
  const avatar = document.querySelector('.avatar');
  const avatarDropdown = document.querySelector('.dropdown-menu.setting');

  if (avatar && avatarDropdown) {
    avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      avatarDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!avatar.contains(e.target)) {
        avatarDropdown.classList.remove('active');
      }
    });
  }

  // ========== SIDEBAR ==========
  const sidebar = document.querySelector('.sidebar');
  const barsIcon = document.querySelector('.fa-bars');
  const menuToggle = document.querySelector('#menu-toggle');

  function toggleSidebar() {
    sidebar?.classList.toggle('active');
  }

  barsIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebar();
  });

  menuToggle?.addEventListener('click', toggleSidebar);

  // ========== GÊNEROS (dropdown da sidebar) ==========
  const genresBtn = document.querySelector('.dropdown-btn');
  const genresDropdown = document.querySelector('.dropdown-container');
  const genresArrow = document.querySelector('.dropdown-btn .dropdown-arrow');

  if (genresBtn && genresDropdown && genresArrow) {
    genresBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      genresDropdown.classList.toggle('active');
      genresArrow.classList.toggle('rotate');
      if (sidebar && !sidebar.classList.contains('active')) {
        sidebar.classList.add('active');
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar') && !e.target.closest('.fa-bars')) {
      genresDropdown?.classList.remove('active');
      genresArrow?.classList.remove('rotate');
    }
  });

  
});
