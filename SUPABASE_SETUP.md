# Configuração do Banco de Dados - Supabase

Este guia contém os scripts SQL necessários para configurar o banco de dados do EvaLog. 
Como o sistema utiliza o Supabase (PostgreSQL), execute os comandos abaixo para criar a estrutura necessária.

## Passo a Passo

1. Acesse o seu projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. No menu lateral esquerdo, clique em **SQL Editor**.
3. Clique em **New Query**.
4. Copie todo o bloco de código SQL abaixo.
5. Cole no editor do Supabase.
6. Clique no botão **Run** (canto inferior direito).

## Script SQL (Schema)

```sql
-- 1. Habilita a extensão para gerar IDs únicos (UUID)
create extension if not exists "uuid-ossp";

-- 2. Criação da Tabela de Bebês (Babies)
create table if not exists public.babies (
  "id" uuid not null primary key default uuid_generate_v4(),
  "ownerId" uuid not null references auth.users(id) on delete cascade,
  "name" text not null,
  "birthDate" bigint not null,
  "gender" text not null check (gender in ('boy', 'girl')),
  "themeColor" text not null default 'rose',
  "weightKg" double precision,
  "heightCm" double precision,
  "photoUrl" text,
  "createdAt" bigint not null
);

-- 3. Criação da Tabela de Registros (Records)
create table if not exists public.records (
  "id" uuid not null primary key default uuid_generate_v4(),
  "ownerId" uuid not null references auth.users(id) on delete cascade,
  "babyId" uuid not null references public.babies("id") on delete cascade,
  "type" text not null check (type in ('breast_left', 'breast_right', 'bottle')),
  "startTime" bigint not null,
  "endTime" bigint,
  "pauses" jsonb,
  "durationSeconds" double precision,
  "volumeMl" double precision,
  "notes" text,
  "createdAt" bigint not null
);

-- 4. Criação da Tabela de Convites (Invites) - NOVO
-- Esta tabela controla quem pode se cadastrar no sistema.
create table if not exists public.invites (
  "code" text not null primary key,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  "used_at" timestamp with time zone,
  "used_by" uuid references auth.users(id)
);

-- 5. Habilitar Row Level Security (RLS)
alter table public.babies enable row level security;
alter table public.records enable row level security;
alter table public.invites enable row level security;

-- 6. Configurar Políticas de Acesso (Policies)

-- Limpeza de políticas antigas
drop policy if exists "Users can manage their own babies" on public.babies;
drop policy if exists "Users can manage their own records" on public.records;
drop policy if exists "Anyone can check invites" on public.invites;
drop policy if exists "Users can update their own invite" on public.invites;
drop policy if exists "Admin full access to invites" on public.invites;

-- Políticas de Usuário (Babies e Records)
create policy "Users can manage their own babies"
on public.babies for all
using (auth.uid() = "ownerId")
with check (auth.uid() = "ownerId");

create policy "Users can manage their own records"
on public.records for all
using (auth.uid() = "ownerId")
with check (auth.uid() = "ownerId");

-- Políticas de Convites (Invites)
-- Permite que qualquer pessoa (mesmo sem login) leia a tabela para verificar se o código existe
create policy "Anyone can read invites"
on public.invites for select
to anon, authenticated
using (true);

-- Permite que um usuário autenticado marque o convite como "usado" se ele estiver livre
create policy "Users can claim open invites"
on public.invites for update
to authenticated
using (used_by is null)
with check (used_by = auth.uid());

-- Permite inserção de convites (Para facilitar, deixaremos aberto para users autenticados neste script, 
-- mas no Frontend controlaremos via email do Admin. Em produção rigorosa, usaríamos uma função segura).
create policy "Authenticated users can create invites"
on public.invites for insert
to authenticated
with check (true);
```

## Configuração de Ambiente

Atualize seu arquivo `.env` com as chaves e o e-mail do administrador:

```env
VITE_SUPABASE_URL=sua_url_do_projeto
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sua_chave_publica
VITE_ADMIN_EMAIL=seu_email_admin@exemplo.com
```

### Como Cadastrar o Administrador:
1. Abra a aplicação.
2. Na tela de Login, tente logar com o e-mail definido em `VITE_ADMIN_EMAIL`.
3. Se a conta não existir, o Supabase retornará erro.
4. Vá ao **Supabase Dashboard > Authentication > Users** e crie este usuário manualmente ("Add User").
5. Agora logue na aplicação. O botão "Gestão de Convites" aparecerá no menu superior.
