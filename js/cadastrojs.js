/**
 * Script de validação e manipulação do formulário de cadastro
 * Versão melhorada com validação em tempo real e feedback visual
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cadastroForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    
    // Objeto com expressões regulares para validação
    const regexPatterns = {
        name: /^[a-zA-ZÀ-ÿ\s]{5,}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        senha: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/,
        telefone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
        cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        cep: /^\d{5}-\d{3}$/,
        estado: /^[A-Z]{2}$/,
        cidade: /^[a-zA-ZÀ-ÿ\s]{3,}$/,
        rua: /^[a-zA-ZÀ-ÿ\s]{5,}$/,
        numero: /^[a-zA-Z0-9\s]{1,}$/,
        data_nascimento: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/
    };
    
    // Mensagens de erro personalizadas
    const errorMessages = {
        name: 'Nome deve ter pelo menos 5 caracteres (apenas letras e espaços)',
        email: 'Por favor, insira um email válido',
        senha: 'A senha deve conter no mínimo 12 caracteres, incluindo uma letra maiúscula, uma minúscula e um número',
        telefone: 'Por favor, insira um telefone válido (ex: (00) 00000-0000)',
        cpf: 'Por favor, insira um CPF válido (ex: 000.000.000-00)',
        cep: 'Por favor, insira um CEP válido (ex: 00000-000)',
        estado: 'Por favor, selecione um estado',
        cidade: 'Cidade deve ter pelo menos 3 caracteres',
        rua: 'Rua deve ter pelo menos 5 caracteres',
        numero: 'Por favor, insira o número',
        data_nascimento: 'Data de nascimento inválida (formato dd/mm/yyyy)'
    };

    // Configura máscaras e funcionalidades extras
    function setupMasksAndFeatures() {
        // Máscara para Data de Nascimento (dd/mm/yyyy)
        const dataNascimentoMask = IMask(document.getElementById('data_nascimento'), {
            mask: '00/00/0000',
            blocks: {
                dd: {
                    mask: IMask.MaskedRange,
                    from: 1,
                    to: 31,
                    maxLength: 2
                },
                mm: {
                    mask: IMask.MaskedRange,
                    from: 1,
                    to: 12,
                    maxLength: 2
                },
                YYYY: {
                    mask: IMask.MaskedRange,
                    from: 1900,
                    to: new Date().getFullYear()
                }
            },
            overwrite: true,
            autofix: true
        });

        // Toggle para mostrar/esconder senha
        const senhaInput = document.getElementById('senha');
        const toggleSenha = document.createElement('span');
        toggleSenha.className = 'toggle-password';
        toggleSenha.innerHTML = '<i class="fa fa-eye"></i>';
        toggleSenha.style.position = 'absolute';
        toggleSenha.style.right = '10px';
        toggleSenha.style.top = '50%';
        toggleSenha.style.transform = 'translateY(-50%)';
        toggleSenha.style.cursor = 'pointer';
        toggleSenha.style.color = 'var(--third-color)';
        
        const senhaContainer = senhaInput.parentNode;
        senhaContainer.style.position = 'relative';
        senhaContainer.appendChild(toggleSenha);
        
        toggleSenha.addEventListener('click', function() {
            const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            senhaInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fa fa-eye"></i>' : '<i class="fa fa-eye-slash"></i>';
        });

        // Container para força da senha
        const strengthContainer = document.createElement('div');
        strengthContainer.className = 'password-strength-container';
        strengthContainer.style.marginTop = '5px';
        
        const strengthText = document.createElement('small');
        strengthText.className = 'password-strength-text';
        strengthText.textContent = 'Força da senha: ';
        
        const strengthMeter = document.createElement('div');
        strengthMeter.className = 'password-strength-meter';
        strengthMeter.style.height = '5px';
        strengthMeter.style.borderRadius = '3px';
        strengthMeter.style.backgroundColor = '#e0e0e0';
        strengthMeter.style.width = '100%';
        strengthMeter.style.marginTop = '5px';
        
        const strengthBar = document.createElement('div');
        strengthBar.className = 'password-strength-bar';
        strengthBar.style.height = '100%';
        strengthBar.style.borderRadius = '3px';
        strengthBar.style.width = '0%';
        strengthBar.style.transition = 'width 0.3s, background-color 0.3s';
        strengthMeter.appendChild(strengthBar);
        
        strengthContainer.appendChild(strengthText);
        strengthContainer.appendChild(strengthMeter);
        senhaContainer.appendChild(strengthContainer);

        senhaInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            updateStrengthMeter(strength);
        });


        // Máscara para CPF
        IMask(document.getElementById('cpf'), {
            mask: '000.000.000-00'
        });
        
        // Máscara para telefone
        IMask(document.getElementById('telefone'), {
            mask: [
                { mask: '(00) 0000-0000' },
                { mask: '(00) 00000-0000' }
            ]
        });
        
        // Máscara para CEP
        IMask(document.getElementById('cep'), {
            mask: '00000-000'
        });
    }

    function checkPasswordStrength(password) {
        let strength = 0;
        
        // Contém caracteres minúsculos
        if (/[a-z]/.test(password)) strength += 20;
        
        // Contém caracteres maiúsculos
        if (/[A-Z]/.test(password)) strength += 20;
        
        // Contém números
        if (/[0-9]/.test(password)) strength += 20;
        
        // Contém caracteres especiais
        if (/[^a-zA-Z0-9]/.test(password)) strength += 20;
        
        // Pontuação por comprimento
        if (password.length >= 8) strength += 10;
        if (password.length >= 12) strength += 10;
        
        return Math.min(strength, 100); // Máximo de 100%
    }
    
    function updateStrengthMeter(strength) {
        const strengthBar = document.querySelector('.password-strength-bar');
        const strengthText = document.querySelector('.password-strength-text .strength-level');
        
        let percent = 0;
        let level = 'Nenhuma';
        let color = '#e0e0e0';
        
        switch(strength) {
            case 1:
                percent = 20;
                level = 'Muito fraca';
                color = '#dc3545';
                break;
            case 2:
                percent = 40;
                level = 'Fraca';
                color = '#ff6b6b';
                break;
            case 3:
                percent = 60;
                level = 'Moderada';
                color = '#ffc107';
                break;
            case 4:
                percent = 80;
                level = 'Forte';
                color = '#4caf50';
                break;
            case 5:
                percent = 100;
                level = 'Muito forte';
                color = '#28a745';
                break;
        }
        
        strengthBar.style.width = `${percent}%`;
        strengthBar.style.backgroundColor = color;
        strengthText.textContent = level;
        strengthText.className = 'strength-level ' + 
            (strength <= 1 ? 'strength-weak' : 
             strength <= 3 ? 'strength-medium' : 'strength-strong');
    }


    function setupRealTimeValidation() {
        Object.keys(regexPatterns).forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
                // Validação ao sair do campo
                input.addEventListener('blur', validateField);
                
                // Validação em tempo real (com debounce para performance)
                let timeout;
                input.addEventListener('input', function(e) {
                    clearTimeout(timeout);
                    if (e.target.value.length > 0) {
                        timeout = setTimeout(() => {
                            validateField(e);
                        }, 500);
                    } else {
                        clearError(input);
                    }
                });
            }
        });
    }



    // Valida um campo individual
    function validateField(e) {
        const input = e.target;
        const fieldId = input.id;
        const value = input.value;
        const regex = regexPatterns[fieldId];
        
        clearError(input);
        
        // Se o campo estiver vazio e não for obrigatório, considere válido
        if ((!value || value.trim() === '') && !input.required) {
            return true;
        }
        
        // Validação especial para data de nascimento
        if (fieldId === 'data_nascimento' && value) {
            if (!validateDate(value)) {
                showError(input, errorMessages.data_nascimento);
                return false;
            }
            markAsValid(input);
            return true;
        }
        
        // Validação com regex
        if (value && regex && !regex.test(value)) {
            showError(input, errorMessages[fieldId]);
            return false;
        }
        
        // Se passou na validação
        if (value) {
            markAsValid(input);
        }
        return true;
    }
    
    // Exibe mensagem de erro para um campo
    function showError(input, message) {
        input.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Insere após o campo, mas antes do próximo elemento
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
        
        // Foca no campo com erro
        input.focus();
    }
    
    // Remove mensagens de erro de um campo
    function clearError(input) {
        input.classList.remove('error');
        
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.className === 'error-message') {
            errorDiv.remove();
        }
    }
    
    // Marca campo como válido
    function markAsValid(input) {
        input.classList.remove('error');
        input.classList.add('success');
        
        // Remove a classe success após um tempo para não poluir visualmente
        setTimeout(() => {
            input.classList.remove('success');
        }, 2000);
    }
    
    // Validação geral do formulário
    function validateForm() {
        let isValid = true;
        
        // Valida todos os campos
        Object.keys(regexPatterns).forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
                // Cria um evento artificial para disparar a validação
                const event = new Event('blur');
                input.dispatchEvent(event);
                
                if (input.classList.contains('error')) {
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }
    
    // Manipulador de envio do formulário
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Valida o formulário
        const isValid = validateForm();
        
        if (isValid) {
            try {
                // Mostra loader no botão
                submitBtn.disabled = true;
                submitText.innerHTML = '<span class="btn-loader"></span> Processando...';
                
                // 1. Obtém o valor da senha em texto puro
                const senhaValue = document.getElementById('senha').value;
                
                // 2. Gera o hash SHA-256 da senha usando CryptoJS com salt
                const salt = CryptoJS.lib.WordArray.random(16).toString();
                const senhaHash = CryptoJS.SHA256(senhaValue + salt).toString();
                
                // 3. Armazena o hash e o salt no campo oculto (serializado)
                document.getElementById('senha_hash').value = JSON.stringify({
                    hash: senhaHash,
                    salt: salt
                });
                
                // 4. Limpa o campo de senha original (não envia em texto puro)
                document.getElementById('senha').value = '';
                
                // Envia o formulário
                form.submit();
            } catch (error) {
                console.error('Erro ao processar formulário:', error);
                submitBtn.disabled = false;
                submitText.textContent = 'Enviar';
                
                // Mostra mensagem de erro
                alert('Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente.');
            }
        }
    });
    
    // Configura validação em tempo real
    function setupRealTimeValidation() {
        // Validação em tempo real para cada campo
        Object.keys(regexPatterns).forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
                input.addEventListener('blur', function(e) {
                    if (!validateField(e)) {
                        // Impede a mudança de campo se houver erro
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            }
        });
    }
    
    // Inicialização
    setupMasksAndFeatures();
    setupRealTimeValidation();
    
    // Validação inicial ao carregar a página (para campos pré-preenchidos)
    if (form) {
        Object.keys(regexPatterns).forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input && input.value) {
                const event = new Event('blur');
                input.dispatchEvent(event);
            }
        });
    }
});