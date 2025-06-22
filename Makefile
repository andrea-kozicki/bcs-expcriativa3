# Makefile robusto e multiplataforma: Linux, macOS, WSL, Git Bash
KEYS_DIR=keys
PRIVATE_KEY_PKCS1=$(KEYS_DIR)/private.pem
PUBLIC_KEY=$(KEYS_DIR)/public.pem
TEMP_PUB_KEY=$(KEYS_DIR)/temp_check_public.pem

ifeq ($(OS),Windows_NT)
    DETECTED_USER=www-data
else
    DETECTED_USER := $(shell id -u http >/dev/null 2>&1 && echo http || \
                      (id -u www-data >/dev/null 2>&1 && echo www-data) || \
                      (id -u apache >/dev/null 2>&1 && echo apache) || \
                      echo www-data)
endif

.PHONY: keys clean hash fix-perms check

keys:
	@echo "🔐 Gerando chave RSA (PKCS#1 direto)..."
	@mkdir -p $(KEYS_DIR)
	@sudo chown -R $(USER):$(USER) $(KEYS_DIR) || true
	@openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 | openssl rsa -traditional -out $(PRIVATE_KEY_PKCS1)
	@echo "📤 Gerando chave pública a partir da privada..."
	@openssl rsa -in $(PRIVATE_KEY_PKCS1) -pubout -out $(PUBLIC_KEY)
	@$(MAKE) fix-perms
	@$(MAKE) hash
	@$(MAKE) check
	@echo "✅ Chave privada: $$(head -n 1 $(PRIVATE_KEY_PKCS1))"

hash:
	@echo "🧾 Gerando hash SHA-256 das chaves:"
	@shasum -a 256 $(PRIVATE_KEY_PKCS1) 2>/dev/null || sha256sum $(PRIVATE_KEY_PKCS1)
	@shasum -a 256 $(PUBLIC_KEY) 2>/dev/null || sha256sum $(PUBLIC_KEY)

fix-perms:
	@echo "🔧 Corrigindo permissões e propriedade..."
	@if [ ! "$(OS)" = "Windows_NT" ]; then \
		echo "🛠️ Aplicando chown/chmod para usuário $(DETECTED_USER)"; \
		sudo chown $(DETECTED_USER):$(DETECTED_USER) $(PRIVATE_KEY_PKCS1) || true; \
		sudo chmod 640 $(PRIVATE_KEY_PKCS1) || true; \
		sudo chown $(DETECTED_USER):$(DETECTED_USER) $(KEYS_DIR) || true; \
		sudo chmod 750 $(KEYS_DIR) || true; \
	fi
	@echo "✅ Permissões corrigidas."

check:
	@echo "🔍 Verificando se chave pública corresponde à privada..."
	@sudo openssl rsa -in $(PRIVATE_KEY_PKCS1) -pubout -out $(TEMP_PUB_KEY) 2>/dev/null
	@cmp --silent $(TEMP_PUB_KEY) $(PUBLIC_KEY) && echo '✅ As chaves correspondem!' || (echo '❌ A chave pública NÃO corresponde à privada!'; exit 1)
	@sudo rm -f $(TEMP_PUB_KEY)

clean:
	@if [ -f $(PRIVATE_KEY_PKCS1) ]; then \
		echo "🔐 Removendo chave privada..."; \
		sudo rm -f $(PRIVATE_KEY_PKCS1); \
	fi
	@if [ -f $(PUBLIC_KEY) ]; then \
		echo "🔐 Removendo chave pública..."; \
		sudo rm -f $(PUBLIC_KEY); \
	fi
	@echo "🧹 Limpeza concluída."
