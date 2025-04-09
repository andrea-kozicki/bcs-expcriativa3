// Obtém referência ao formulário pelo ID
const form = document.getElementById('cadastroForm');

// Adiciona um listener para o evento de submit
form.addEventListener('submit', (event) => {
    // Variável para controlar se o formulário é válido
    let isValid = true;

    // Função para exibir mensagens de erro
    function showError(input, message) {
        // Cria um elemento div para a mensagem de erro
        const error = document.createElement('div');
        error.style.color = 'red'; // Cor vermelha
        error.textContent = message; // Texto da mensagem
        // Insere a mensagem após o campo de input
        input.parentNode.insertBefore(error, input.nextSibling);
        // Marca o formulário como inválido
        isValid = false;
    }

    // Remove todas as mensagens de erro anteriores
    const errors = form.querySelectorAll('div');
    errors.forEach(error => error.remove());

    // Validação do campo Nome
    const nome = document.getElementById('nome');
    if (!nome.value.trim()) showError(nome, 'Nome é obrigatório.');

    // Validação do campo Email
    const email = document.getElementById('email');
    if (!email.value.trim()) {
        showError(email, 'Email é obrigatório.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        // Regex para validar formato de email
        showError(email, 'Email inválido.');
    }

    // Validação do campo Usuário
    const usuario = document.getElementById('usuario');
    if (!usuario.value.trim()) {
        showError(usuario, 'Usuário é obrigatório.');
    } else if (usuario.value.length < 4) {
        showError(usuario, 'Usuário deve ter pelo menos 4 caracteres.');
    }

    // Validação do campo Senha
    const senha = document.getElementById('senha');
    if (!senha.value.trim()) {
        showError(senha, 'Senha é obrigatória.');
    } else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:'<>?~`\-=[\]\\;',./]).{6,}$/.test(senha.value)) {
        // Regex complexa para validar senha forte
        showError(senha, 'A senha deve conter no mínimo 6 caracteres, uma letra maiúscula, um número e um caractere especial.');
    }

    // Validação do campo Telefone
    const telefone = document.getElementById('telefone');
    if (!telefone.value.trim()) {
        showError(telefone, 'Telefone é obrigatório.');
    } else if (!/^\d{10,11}$/.test(telefone.value)) {
        // Regex para validar 10 ou 11 dígitos
        showError(telefone, 'Telefone deve ter 10 ou 11 dígitos.');
    }

    // Validação do campo CPF
    const cpf = document.getElementById('cpf');
    if (!cpf.value.trim()) {
        showError(cpf, 'CPF é obrigatório.');
    } else if (!/^\d{11}$/.test(cpf.value)) {
        // Regex para validar exatamente 11 dígitos
        showError(cpf, 'CPF deve ter 11 dígitos.');
    }

    // Validação do campo Data de Nascimento
    const dataNascimento = document.getElementById('data_nascimento');
    const hoje = new Date(); // Data atual
    if (!dataNascimento.value) {
        showError(dataNascimento, 'Data de nascimento é obrigatória.');
    } else if (new Date(dataNascimento.value) > hoje) {
        // Verifica se a data não é no futuro
        showError(dataNascimento, 'Data não pode ser no futuro.');
    }

    // Validação do campo CEP
    const cep = document.getElementById('cep');
    if (!cep.value.trim()) {
        showError(cep, 'CEP é obrigatório.');
    } else if (!/^\d{8}$/.test(cep.value)) {
        // Regex para validar exatamente 8 dígitos
        showError(cep, 'CEP deve ter 8 dígitos.');
    }

    // Validação do campo Estado
    const estado = document.getElementById('estado');
    if (!estado.value.trim()) {
        showError(estado, 'Estado é obrigatório.');
    } else if (!/^[A-Za-z]{2}$/.test(estado.value)) {
        // Regex para validar exatamente 2 letras
        showError(estado, 'Estado deve ter 2 letras.');
    }

    // Validação do campo Cidade
    const cidade = document.getElementById('cidade');
    if (!cidade.value.trim()) showError(cidade, 'Cidade é obrigatória.');

    // Validação do campo Rua
    const rua = document.getElementById('rua');
    if (!rua.value.trim()) showError(rua, 'Rua é obrigatória.');

    // Validação do campo Número
    const numero = document.getElementById('numero');
    if (!numero.value.trim()) showError(numero, 'Número é obrigatório.');

    // Se o formulário estiver válido
    if (isValid) {
        // 1. Obtém o valor da senha em texto puro
        const senhaValue = document.getElementById('senha').value;
        
        // 2. Gera o hash SHA-256 da senha usando CryptoJS
        const senhaHash = CryptoJS.SHA256(senhaValue).toString();
        
        // 3. Armazena o hash no campo oculto
        document.getElementById('senha_hash').value = senhaHash;
        
        // 4. Limpa o campo de senha original (não envia em texto puro)
        document.getElementById('senha').value = '';
        
        // O formulário será submetido normalmente com o hash no lugar da senha
    } else {
        // Se o formulário for inválido, previne o envio
        event.preventDefault();
    }
});