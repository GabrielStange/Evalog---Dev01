# EvaLog - Monitor de Amamentação com IA

Este projeto é uma aplicação web React (Vite) integrada com Supabase e Google Gemini AI para monitoramento de amamentação.

## 🚀 Como Publicar (Deploy)

### Pré-requisitos
1. Uma conta no [GitHub](https://github.com).
2. Uma conta no [Supabase](https://supabase.com).
3. Uma conta no [Netlify](https://netlify.com).
4. Uma chave de API do [Google AI Studio](https://aistudio.google.com/app/apikey).

### Passo 1: Configuração do Supabase (Banco de Dados)

1. Crie um novo projeto no Supabase.
2. Siga as instruções detalhadas no arquivo **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** para criar as tabelas e políticas de segurança.
3. **Criação do Administrador:**
    - Vá ao menu **Authentication** > **Users**.
    - Clique em **Add User** > **Create New User**.
    - Insira o e-mail e senha do Administrador (ex: `admin@evalog.app`).
    - Clique em **Create User**.

### Passo 2: Configuração do Código (Variáveis de Ambiente)

Para que a aplicação funcione, ela precisa se conectar ao seu projeto Supabase.

1. No painel do Supabase, vá em **Project Settings** > **API**.
2. Copie a `Project URL` e a `anon` / `public` Key.

### Passo 3: Publicação no Netlify

1. Faça o Login no Netlify.
2. Clique em **Add new site** > **Import from an existing project**.
3. Conecte ao **GitHub** e selecione este repositório.
4. Na tela de configuração de build ("Build settings"):
    - **Build command:** `npm run build`
    - **Publish directory:** `dist`
5. Clique em **Show advanced** > **New Variable** e adicione as seguintes variáveis:

| Key | Value | Descrição |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | *Sua URL do Supabase* | URL do Projeto (Passo 2) |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | *Sua Key Pública do Supabase* | Chave Pública (Passo 2) |

6. Clique em **Deploy site**.

---

## 🛠 Desenvolvimento Local

Para rodar o projeto na sua máquina:

1. Clone o repositório.
2. Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sua_chave_publica
```

3. Instale as dependências e rode:

```bash
npm install
npm run dev
```

## 🔐 Gestão de Usuários

O sistema de cadastro é fechado (requer convite ou criação manual).
1. O **Administrador** deve ser criado manualmente no painel do Supabase (Authentication).
2. Para adicionar novos usuários (ex: cônjuge, babá), o Administrador deve criar um **Convite** (feature futura) ou criar o usuário manualmente no painel do Supabase.