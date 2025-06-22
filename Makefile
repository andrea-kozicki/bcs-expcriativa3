# Diretórios
KEYS_DIR=keys
PUBLIC_KEY_SRC=$(KEYS_DIR)/public.pem
PUBLIC_KEY_DEST=js/public-key.pem

# Arquivos de chave
PRIVATE_KEY=$(KEYS_DIR)/private.pem
PRIVATE_RSA_KEY=$(KEYS_DIR)/private-rsa.pem

.PHONY: keys copy-pub clean

# Gera chave privada RSA (PKCS#1) e chave pública
keys:
	@echo "🔐 Gerando chave privada RSA (PKCS#1)..."
	@mkdir -p $(KEYS_DIR)
	@openssl genrsa -out $(PRIVATE_KEY) 2048
	@cp $(PRIVATE_KEY) $(PRIVATE_RSA_KEY)
	@echo "📤 Gerando chave pública..."
	@openssl rsa -in $(PRIVATE_KEY) -pubout -out $(PUBLIC_KEY_SRC)
	@echo "✅ Chaves geradas em $(KEYS_DIR)"

# Copia a chave pública para o JS (para ser usada no frontend)
copy-pub:
	@echo "📁 Copiando chave pública para uso em JS..."
	@cp $(PUBLIC_KEY_SRC) $(PUBLIC_KEY_DEST)
	@echo "✅ Copiada para: $(PUBLIC_KEY_DEST)"

# Remove chaves
clean:
	@echo "🧹 Limpando arquivos de chave..."
	@rm -f $(KEYS_DIR)/*.pem
	@rm -f $(PUBLIC_KEY_DEST)
	@echo "✅ Limpeza concluída"
