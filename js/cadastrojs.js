/**
 * Script de validação e manipulação do formulário de cadastro
 * 
 * Funcionalidades principais:
 * - Validação em tempo real dos campos
 * - Máscaras para campos específicos (CPF, telefone, CEP, data)
 * - Medidor de força da senha
 * - Toggle para mostrar/esconder senha
 * - Validação de data de nascimento
 * - Feedback visual para o usuário
 * 
 * Dependências:
 * - IMask.js (para máscaras de entrada)
 * - CryptoJS (para hash da senha)
 * - Font Awesome (para ícones)
 */

document.addEventListener('DOMContentLoaded', function() {
    // =============================================
    // CONFIGURAÇÕES INICIAIS E SELEÇÃO DE ELEMENTOS
    // =============================================
    const form = document.getElementById('cadastroForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    
    if (!form || !submitBtn || !submitText) {
        console.error('Elementos do formulário não encontrados');
        return;
    }

    document.addEventListener('DOMContentLoaded', function() {
        console.log('Elementos verificados:');
        console.log('Formulário:', document.getElementById('cadastroForm'));
        console.log('Senha:', document.getElementById('senha'));
        console.log('Senha Hash:', document.getElementById('senha_hash'));
        console.log('SubmitBtn:', document.getElementById('submitBtn'));
    });


    // =============================================
    // DEFINIÇÕES DE VALIDAÇÃO
    // =============================================
    
    // Padrões regex para validação
    const regexPatterns = {
        name: /^[a-zA-ZÀ-ÿ\s]{5,}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        senha: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
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
        senha: 'A senha deve ter no mínimo 12 caracteres, incluindo: uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&)',
        telefone: 'Por favor, insira um telefone válido (ex: (00) 00000-0000)',
        cpf: 'Por favor, insira um CPF válido (ex: 000.000.000-00)',
        cep: 'Por favor, insira um CEP válido (ex: 00000-000)',
        estado: 'Por favor, selecione um estado',
        cidade: 'Cidade deve ter pelo menos 3 caracteres',
        rua: 'Rua deve ter pelo menos 5 caracteres',
        numero: 'Por favor, insira o número',
        data_nascimento: 'Data de nascimento inválida (formato dd/mm/yyyy)'
    };


    // Verificação de dependências
    if (typeof IMask === 'undefined') {
        console.error('IMask não está carregado. As máscaras não funcionarão.');
        return;
    }
    
    if (typeof CryptoJS === 'undefined') {
        console.error('CryptoJS não está carregado. A criptografia da senha não funcionará.');
    }


    // =============================================
    // FUNÇÕES PRINCIPAIS
    // =============================================

    /**
     * Configura todas as máscaras e funcionalidades extras dos campos
     */
    function setupMasksAndFeatures() {
        setupPasswordToggle();
        setupPasswordStrengthMeter();
        setupInputMasks();
        setupCepAutoComplete();
    }

    /**
     * Configura o toggle para mostrar/esconder a senha
     */
    function setupPasswordToggle() {
    const toggleSenha = document.querySelector('.password-container .toggle-password');
    const senhaInput = document.getElementById('senha');
    
    if (!toggleSenha || !senhaInput) {
        console.warn('Elementos de toggle de senha não encontrados');
        return;
    }
    
    toggleSenha.addEventListener('click', function() {
        const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
        senhaInput.setAttribute('type', type);
        
        this.innerHTML = type === 'password' 
            ? '<i class="fa fa-eye"></i>' 
            : '<i class="fa fa-eye-slash"></i>';
        
        this.style.color = type === 'password' 
            ? 'var(--medium-gray)' 
            : 'var(--primary-color)';
    });
    }

    /**
     * Configura o medidor de força da senha
     */
    function setupPasswordStrengthMeter() {
        const passwordInput = document.getElementById('senha');
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                const strength = checkPasswordStrength(this.value);
                updateStrengthMeter(strength);
            });
        }
    }

    /**
     * Configura as máscaras para os campos de formulário
     */
    function setupInputMasks() {
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

        // Máscara SIMPLIFICADA para data de nascimento (dd/mm/aaaa)
        IMask(document.getElementById('data_nascimento'), {
            mask: '00/00/0000',
            blocks: {
                dd: { mask: IMask.MaskedRange, from: 1, to: 31 },
                mm: { mask: IMask.MaskedRange, from: 1, to: 12 },
                yyyy: { mask: IMask.MaskedRange, from: 1900, to: new Date().getFullYear() }
            },
            // Garante que sempre mostra com 2 dígitos para dia e mês
            format: function (value) {
                const parts = value.split('/');
                if (parts[0] && parts[0].length === 1) parts[0] = '0' + parts[0];
                if (parts[1] && parts[1].length === 1) parts[1] = '0' + parts[1];
                return parts.join('/');
            }
        });
    }

    /**
 * Valida uma data no formato dd/mm/yyyy
 * @param {string} dateString - Data no formato dd/mm/yyyy
 * @returns {boolean} True se a data for válida
 */
    function validateDate(dateString) {
        // Verifica o formato básico
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return false;
        
        const parts = dateString.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Verifica valores numéricos básicos
        if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        
        // Verifica meses com 30 dias
        if ([4, 6, 9, 11].includes(month) && day > 30) return false;
        
        // Verifica fevereiro e anos bissextos
        if (month === 2) {
            const isLeapYear = (year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0);
            if (day > (isLeapYear ? 29 : 28)) return false;
        }
        
        // Verifica se a data não é no futuro
        const inputDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Ignora a hora para comparação
        
        return inputDate <= today;
    }


    /**
     * Configura o preenchimento automático do endereço via CEP
     */
    function setupCepAutoComplete() {
        const cepInput = document.getElementById('cep');
        if (cepInput) {
            cepInput.addEventListener('blur', async function() {
                const cep = this.value.replace(/\D/g, '');
                if (cep.length === 8) {
                    try {
                        // Mostrar estado de carregamento
                        const estadoSelect = document.getElementById('estado');
                        estadoSelect.disabled = true;
                        estadoSelect.innerHTML = '<option value="">Buscando...</option>';
                        
                        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                        const data = await response.json();
                        
                        if (!data.erro) {
                            // Preenche os campos
                            document.getElementById('rua').value = data.logradouro || '';
                            document.getElementById('cidade').value = data.localidade || '';
                            
                            // Atualiza o select de estado
                            estadoSelect.innerHTML = `<option value="${data.uf}" selected>${data.uf}</option>`;
                            estadoSelect.disabled = false;
                            
                            // Dispara eventos de validação
                            ['rua', 'cidade', 'estado'].forEach(id => {
                                const input = document.getElementById(id);
                                if (input) {
                                    const event = new Event('change');
                                    input.dispatchEvent(event);
                                }
                            });
                            
                            document.getElementById('numero').focus();
                        } else {
                            estadoSelect.innerHTML = '<option value="">Selecione...</option>';
                            estadoSelect.disabled = false;
                            console.log('CEP não encontrado');
                        }
                    } catch (error) {
                        console.error('Erro ao buscar CEP:', error);
                        const estadoSelect = document.getElementById('estado');
                        estadoSelect.innerHTML = '<option value="">Selecione...</option>';
                        estadoSelect.disabled = false;
                    }
                }
            });
        }
    }


    /**
     * Calcula a força da senha com base em vários critérios
     * @param {string} password - A senha a ser avaliada
     * @returns {number} Nível de força de 0 a 6
     */
    function checkPasswordStrength(password) {
        if (!password) return 0;
        
        let strength = 0;
        
        // Verifica comprimento mínimo
        if (password.length >= 12) strength += 2;
        
        // Verifica tipos de caracteres
        if (/[a-z]/.test(password)) strength += 1; // Letras minúsculas
        if (/[A-Z]/.test(password)) strength += 1; // Letras maiúsculas
        if (/[0-9]/.test(password)) strength += 1; // Números
        if (/[@$!%*?&]/.test(password)) strength += 2; // Caracteres especiais
        
        return Math.min(strength, 6); // Limita a 6 níveis
    }
    /**
     * Atualiza o visual do medidor de força da senha
     * @param {number} strength - Nível de força (0-6)
     */
    function updateStrengthMeter(strength) {
        const strengthBar = document.querySelector('.password-strength-bar');
        const strengthLevel = document.querySelector('.strength-level');
        
        if (!strengthBar || !strengthLevel) return;
        
        // Reset classes
        strengthBar.className = 'password-strength-bar';
        strengthLevel.className = 'strength-level';
        
        // Define o texto e classes com base no nível de força
        switch(true) {
            case (strength <= 1):
                strengthLevel.textContent = 'Muito fraca';
                strengthLevel.classList.add('strength-weak');
                strengthBar.classList.add('weak');
                break;
            case (strength === 2):
                strengthLevel.textContent = 'Fraca';
                strengthLevel.classList.add('strength-weak');
                strengthBar.classList.add('weak');
                break;
            case (strength === 3):
                strengthLevel.textContent = 'Moderada';
                strengthLevel.classList.add('strength-medium');
                strengthBar.classList.add('medium');
                break;
            case (strength === 4):
                strengthLevel.textContent = 'Forte';
                strengthLevel.classList.add('strength-strong');
                strengthBar.classList.add('strong');
                break;
            case (strength >= 5):
                strengthLevel.textContent = 'Muito forte';
                strengthLevel.classList.add('strength-strong');
                strengthBar.classList.add('very-strong');
                break;
            default:
                strengthLevel.textContent = 'Nenhuma';
        }
    }

    /**
     * Configura a validação em tempo real para todos os campos
     */
    function setupRealTimeValidation() {
        Object.keys(regexPatterns).forEach(fieldId => {
            // Exclui o campo de senha da validação em tempo real
            if (fieldId === 'senha') return;
            
            const input = document.getElementById(fieldId);
            if (input) {
                // Validação ao sair do campo
                input.addEventListener('blur', validateField);
                
                // Validação em tempo real com debounce (para performance)
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

    /**
     * Valida um campo individual do formulário
     * @param {Event} e - Evento de input ou blur
     * @returns {boolean} True se o campo for válido
     */
    function validateField(e) {
        const input = e.target;
        const fieldId = input.id;
        const value = input.value;
        const regex = regexPatterns[fieldId];
        
        clearError(input);
        
        // Campos não obrigatórios vazios são considerados válidos
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
        
        // Validação com regex para outros campos
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

    /**
     * Valida uma data no formato dd/mm/yyyy
     * @param {string} dateString - Data no formato dd/mm/yyyy
     * @returns {boolean} True se a data for válida
     */
    function validateDate(dateString) {
        // Verifica o formato básico
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return false;
        
        const parts = dateString.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Verifica valores numéricos
        if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
        
        // Verifica limites do mês e dia
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        
        // Verifica meses com 30 dias
        if ([4, 6, 9, 11].includes(month) && day > 30) return false;
        
        // Verifica fevereiro e anos bissextos
        if (month === 2) {
            const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            if (day > (isLeapYear ? 29 : 28)) return false;
        }
        
        // Verifica se a data não é no futuro
        const inputDate = new Date(year, month - 1, day);
        const today = new Date();
        if (inputDate > today) return false;
        
        return true;
    }

    /**
     * Exibe mensagem de erro para um campo
     * @param {HTMLElement} input - Elemento de input
     * @param {string} message - Mensagem de erro
     */
    function showError(input, message) {
        input.classList.add('error');
        
        // Remove mensagens de erro existentes
        clearError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Para o campo de senha, insira após o container de força
        if (input.id === 'senha') {
            const passwordContainer = input.closest('.form-col');
            const strengthContainer = passwordContainer.querySelector('.password-strength-container');
            if (strengthContainer) {
                strengthContainer.insertAdjacentElement('afterend', errorDiv);
            } else {
                input.parentNode.insertBefore(errorDiv, input.nextSibling);
            }
        } else {
            // Para outros campos, mantenha o comportamento padrão
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
        
        input.focus();
    }

    /**
     * Remove mensagens de erro de um campo
     * @param {HTMLElement} input - Elemento de input
     */
    function clearError(input) {
        input.classList.remove('error');
        
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.className === 'error-message') {
            errorDiv.remove();
        }
    }

    /**
     * Marca um campo como válido (feedback visual)
     * @param {HTMLElement} input - Elemento de input
     */
    function markAsValid(input) {
        input.classList.remove('error');
        input.classList.add('success');
        
        // Remove a classe de sucesso após 2 segundos
        setTimeout(() => {
            input.classList.remove('success');
        }, 2000);
    }

    /**
     * Valida todo o formulário antes do envio
     * @returns {boolean} True se todos os campos forem válidos
     */
    function validateForm() {
        let isValid = true;
        
        Object.keys(regexPatterns).forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
                // Dispara validação artificial
                const event = new Event('blur');
                input.dispatchEvent(event);
                
                if (input.classList.contains('error')) {
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    // =============================================
    // EVENTO DE SUBMISSÃO DO FORMULÁRIO
    // =============================================
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (validateForm()) {
            try {
                const senhaInput = document.getElementById('senha');
                const senhaHashField = document.getElementById('senha_hash');
                
                submitBtn.disabled = true;
                submitText.innerHTML = '<span class="btn-loader"></span> Processando...';
                
                // Cria um FormData para enviar todos os campos
                const formData = new FormData(form);
                
                // Remove a senha em texto puro (não vamos enviar)
                formData.delete('senha');
                
                // Adiciona o hash e salt como campos separados
                const salt = CryptoJS.lib.WordArray.random(16).toString();
                const senhaHash = CryptoJS.SHA256(senhaInput.value + salt).toString();
                
                formData.append('senha_hash', senhaHash);
                formData.append('salt', salt);
                
                // Debug: mostra o que será enviado
                console.log('Dados a serem enviados:', Object.fromEntries(formData));
                
                // Envia via fetch para melhor controle
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData
                });
                
                // Se recebeu redirecionamento, segue automaticamente
                if (response.redirected) {
                    window.location.href = response.url;
                }
                
            } catch (error) {
                console.error('Erro:', error);
                submitBtn.disabled = false;
                submitText.textContent = 'Cadastrar';
                alert('Erro no envio. Verifique o console para detalhes.');
            }
        }
    });

    // =============================================
    // INICIALIZAÇÃO
    // =============================================
    setupMasksAndFeatures();
    setupRealTimeValidation();
    
    // Valida campos pré-preenchidos ao carregar a página
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