# Configuração do Banco de Dados - Supabase (Com Suporte a Famílias)

Este guia contém os scripts SQL atualizados para configurar o banco de dados do EvaLog com suporte a compartilhamento familiar.

## Passo a Passo

1. Acesse o seu projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. No menu lateral esquerdo, clique em **SQL Editor**.
3. Clique em **New Query**.
4. Copie todo o bloco de código SQL abaixo.
5. Cole no editor do Supabase e clique em **Run**.

## Script SQL (Schema Atualizado)

```sql
-- 1. Extensões
create extension if not exists "uuid-ossp";

-- 2. Tabela de Famílias
create table if not exists public.families (
  "id" uuid not null primary key default uuid_generate_v4(),
  "name" text not null,
  "created_by" uuid references auth.users(id),
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Membros da Família
create table if not exists public.family_members (
  "family_id" uuid references public.families(id) on delete cascade,
  "user_id" uuid references auth.users(id) on delete cascade,
  "role" text default 'member' check (role in ('admin', 'member')),
  primary key (family_id, user_id)
);

-- 4. Tabela de Bebês (Atualizada com familyId)
create table if not exists public.babies (
  "id" uuid not null primary key default uuid_generate_v4(),
  "familyId" uuid references public.families(id) on delete cascade,
  "ownerId" uuid references auth.users(id), -- Mantido para legado
  "name" text not null,
  "birthDate" bigint not null,
  "gender" text not null check (gender in ('boy', 'girl')),
  "themeColor" text not null default 'rose',
  "weightKg" double precision,
  "heightCm" double precision,
  "photoUrl" text,
  "createdAt" bigint not null
);

-- 5. Tabela de Registros (Atualizada com familyId)
create table if not exists public.records (
  "id" uuid not null primary key default uuid_generate_v4(),
  "familyId" uuid references public.families(id) on delete cascade,
  "ownerId" uuid references auth.users(id), -- Mantido para legado
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

-- 6. Tabela de Convites (Atualizada)
create table if not exists public.invites (
  "code" text not null primary key,
  "family_id" uuid references public.families(id) on delete cascade,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  "used_at" timestamp with time zone,
  "used_by" uuid references auth.users(id)
);

-- 7. Habilitar RLS
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.babies enable row level security;
alter table public.records enable row level security;
alter table public.invites enable row level security;

-- 8. Funções Auxiliares para RLS
-- Função para verificar se o usuário atual pertence à família do registro
create or replace function is_family_member(_family_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.family_members
    where family_id = _family_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 9. Políticas (Policies)

-- FAMILIES
create policy "Users can see families they belong to"
on public.families for select
using ( id in (select family_id from public.family_members where user_id = auth.uid()) );

create policy "Users can create families"
on public.families for insert
with check ( auth.uid() = created_by );

-- FAMILY_MEMBERS
create policy "Users can see members of their families"
on public.family_members for select
using ( family_id in (select family_id from public.family_members where user_id = auth.uid()) );

create policy "Users can join families (Self Insert via Invite Logic handled in app)"
on public.family_members for insert
with check ( auth.uid() = user_id );

-- BABIES
create policy "Family members can view babies"
on public.babies for select
using ( is_family_member("familyId") );

create policy "Family members can insert babies"
on public.babies for insert
with check ( is_family_member("familyId") );

create policy "Family members can update babies"
on public.babies for update
using ( is_family_member("familyId") );

-- RECORDS
create policy "Family members can view records"
on public.records for select
using ( is_family_member("familyId") );

create policy "Family members can insert records"
on public.records for insert
with check ( is_family_member("familyId") );

create policy "Family members can update/delete records"
on public.records for all
using ( is_family_member("familyId") );

-- INVITES
create policy "Anyone can check invites"
on public.invites for select
to anon, authenticated
using (true);

create policy "Family members can create invites"
on public.invites for insert
to authenticated
with check ( is_family_member(family_id) );

create policy "Users can consume invites"
on public.invites for update
to authenticated
using (true);
```

## Configuração de Ambiente (.env)

Adicione a variável para controlar a criação de novas famílias:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
VITE_ADMIN_EMAIL=...
VITE_ENABLE_FAMILY_CREATION=true
```
