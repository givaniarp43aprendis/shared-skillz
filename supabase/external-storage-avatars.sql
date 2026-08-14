-- Bucket público "avatars" + políticas de acesso.
-- Rode este script no SQL Editor do seu projeto Supabase.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Leitura pública das imagens
drop policy if exists "Avatars são públicos" on storage.objects;
create policy "Avatars são públicos"
on storage.objects for select
using (bucket_id = 'avatars');

-- Cada usuário só grava dentro da sua própria pasta (<user_id>/arquivo.jpg)
drop policy if exists "Usuário envia seu avatar" on storage.objects;
create policy "Usuário envia seu avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Usuário atualiza seu avatar" on storage.objects;
create policy "Usuário atualiza seu avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Usuário remove seu avatar" on storage.objects;
create policy "Usuário remove seu avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
