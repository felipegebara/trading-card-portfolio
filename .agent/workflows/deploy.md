---
description: Como publicar o app em um site (Vercel/Netlify)
---

# 🚀 Publicar App em um Site

Este guia mostra como publicar seu app Angular em diferentes plataformas de hospedagem.

## Pré-requisitos

- Conta no GitHub (criar em [github.com](https://github.com))
- Node.js instalado
- Git instalado

---

## 📋 Passo 1: Resolver Problemas de PowerShell (Windows)

Se você encontrar erro de "running scripts is disabled", execute este comando no PowerShell **como Administrador**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Depois confirme com `Y` (Yes).

---

## 🔧 Passo 2: Testar o Build Localmente

Antes de publicar, vamos garantir que o build funciona:

// turbo
```bash
npm run build
```

Isso deve criar uma pasta `dist` com os arquivos compilados.

---

## 📦 Passo 3: Preparar Repositório GitHub

### 3.1 Criar repositório no GitHub
1. Acesse [github.com/new](https://github.com/new)
2. Nome: `trading-card-portfolio` (ou outro nome)
3. Deixe como **público** ou **privado**
4. **NÃO** marque "Initialize with README"
5. Clique em **Create repository**

### 3.2 Fazer push do código

Execute no terminal (na pasta do projeto):

```bash
git init
git add .
git commit -m "Initial commit: Pokemon Portfolio App"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

> ⚠️ **Importante**: Substitua `SEU_USUARIO` e `SEU_REPOSITORIO` pelos valores corretos!

---

## 🌐 Opção A: Deploy no Vercel (Recomendado)

### Por que Vercel?
- ✅ **Gratuito** para projetos pessoais
- ✅ Deploy automático via GitHub
- ✅ SSL/HTTPS automático
- ✅ Domínio gratuito (.vercel.app)
- ✅ Muito fácil de configurar

### Passos:

#### 1. Criar conta no Vercel
- Acesse [vercel.com](https://vercel.com)
- Clique em **Sign Up**
- Faça login com sua conta do **GitHub**

#### 2. Importar projeto
- No dashboard, clique em **Add New... → Project**
- Clique em **Import Git Repository**
- Selecione o repositório `trading-card-portfolio`
- Clique em **Import**

#### 3. Configurar projeto
Na tela de configuração:

**Framework Preset**: Detectará automaticamente "Angular"

**Build Settings**:
- Build Command: `npm run build`
- Output Directory: `dist/copy-of-trading-card-portfolio/browser`

#### 4. Adicionar Variáveis de Ambiente
Clique em **Environment Variables** e adicione:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | (sua chave do arquivo .env.local) |

> 💡 Adicione qualquer outra variável que esteja no seu `.env.local`

#### 5. Deploy!
- Clique em **Deploy**
- Aguarde 2-3 minutos
- Pronto! Seu app estará no ar 🎉

#### 6. Acessar o app
Vercel fornecerá uma URL como:
```
https://seu-projeto.vercel.app
```

### 🔄 Atualizações Automáticas
Toda vez que você fizer push no GitHub, o Vercel automaticamente:
1. Detecta as mudanças
2. Faz novo build
3. Publica a nova versão

Para atualizar:
```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

---

## 🌐 Opção B: Deploy no Netlify

### Passos:

#### 1. Criar conta
- Acesse [netlify.com](https://netlify.com)
- Faça login com GitHub

#### 2. Novo site
- Clique em **Add new site → Import an existing project**
- Conecte ao GitHub
- Selecione seu repositório

#### 3. Configurações de build
- Build command: `npm run build`
- Publish directory: `dist/copy-of-trading-card-portfolio/browser`

#### 4. Variáveis de ambiente
- Vá em **Site settings → Environment variables**
- Adicione as variáveis do `.env.local`

#### 5. Deploy
- Clique em **Deploy site**
- URL será algo como: `https://seu-site.netlify.app`

---

## 🔥 Opção C: Deploy no Firebase Hosting

### 1. Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login no Firebase
// turbo
```bash
firebase login
```

### 3. Inicializar projeto
```bash
firebase init hosting
```

Selecione:
- Use an existing project (ou crie um novo)
- Public directory: `dist/copy-of-trading-card-portfolio/browser`
- Configure as SPA: **Yes**
- Automatic builds: **No**

### 4. Fazer build
```bash
npm run build
```

### 5. Deploy
```bash
firebase deploy
```

URL será: `https://seu-projeto.web.app`

---

## 🎯 Configurações Adicionais

### Domínio Personalizado

**Vercel:**
1. Vá em **Settings → Domains**
2. Clique em **Add Domain**
3. Siga as instruções para configurar DNS

**Netlify:**
1. Vá em **Domain settings**
2. Clique em **Add custom domain**
3. Configure os registros DNS

### Configurar CORS no Supabase

Se usar Supabase, adicione o domínio do seu site:
1. Acesse o dashboard do Supabase
2. Vá em **Settings → API**
3. Em **Site URL**, adicione: `https://seu-site.vercel.app`

---

## 🐛 Problemas Comuns

### Build falha
- Verifique se todas as dependências estão no `package.json`
- Teste o build local primeiro: `npm run build`

### Variáveis de ambiente não funcionam
- Certifique-se de adicionar TODAS as variáveis do `.env.local`
- No Vercel/Netlify, vá em Environment Variables e adicione manualmente

### App não carrega
- Verifique se o Output Directory está correto
- Para Angular: `dist/NOME_DO_PROJETO/browser`

### Erro 404 ao navegar
- Configure como SPA (Single Page Application)
- Vercel/Netlify fazem isso automaticamente para Angular

---

## ✅ Checklist Final

- [ ] Build local funcionando (`npm run build`)
- [ ] Código no GitHub
- [ ] Variáveis de ambiente configuradas na plataforma
- [ ] Deploy realizado com sucesso
- [ ] App acessível pela URL fornecida
- [ ] CORS configurado no Supabase (se aplicável)

---

## 📚 Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Netlify](https://docs.netlify.com/)
- [Documentação Firebase](https://firebase.google.com/docs/hosting)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
