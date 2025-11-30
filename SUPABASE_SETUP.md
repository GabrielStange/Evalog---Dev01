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
-- As colunas usam aspas ("coluna") para garantir que o nome seja case-sensitive (CamelCase),
-- facilitando o mapeamento direto com o código TypeScript.
create table if not exists public.babies (
  "id" uuid not null primary key default uuid_generate_v4(),
  "ownerId" uuid not null references auth.users(id) on delete cascade,
  "name" text not null,
  "birthDate" bigint not null, -- Timestamp em milissegundos
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
  "pauses" jsonb, -- Armazena array de pausas no formato JSON
  "durationSeconds" double precision,
  "volumeMl" double precision,
  "notes" text,
  "createdAt" bigint not null
);

-- 4. Habilitar Row Level Security (RLS)
-- Isso ativa o sistema de segurança onde políticas definem quem pode ver o quê.
alter table public.babies enable row level security;
alter table public.records enable row level security;

-- 5. Configurar Políticas de Acesso (Policies)

-- Remover políticas antigas se existirem para evitar conflitos ao rodar o script novamente
drop policy if exists "Users can manage their own babies" on public.babies;
drop policy if exists "Users can manage their own records" on public.records;

-- Política: Usuários só podem ver/editar/deletar dados onde o "ownerId" é igual ao seu ID de login
create policy "Users can manage their own babies"
on public.babies
for all
using (auth.uid() = "ownerId")
with check (auth.uid() = "ownerId");

create policy "Users can manage their own records"
on public.records
for all
using (auth.uid() = "ownerId")
with check (auth.uid() = "ownerId");
```

## Configuração de Ambiente

Após rodar o script, certifique-se de pegar suas chaves de API em **Project Settings > API** e atualizar seu arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_projeto
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
```
