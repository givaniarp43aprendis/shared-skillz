-- ============================================================
-- Vizinho Indica — schema completo (rodar no SQL Editor)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key,
  name text,
  neighborhood text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text,
  phone text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists services_user_id_idx on public.services(user_id);
create index if not exists reviews_service_id_idx on public.reviews(service_id);

-- Permissões (Data API)
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;

grant select, insert, update, delete on public.services to authenticated;
-- anon NÃO enxerga a coluna phone (proteção de dado sensível)
grant select (id, user_id, title, description, category, image_url, created_at) on public.services to anon;
grant all on public.services to service_role;

grant select, insert, update, delete on public.reviews to authenticated;
grant select on public.reviews to anon;
grant all on public.reviews to service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile" on public.profiles for delete to authenticated using (auth.uid() = id);

drop policy if exists "Services are viewable by everyone" on public.services;
create policy "Services are viewable by everyone" on public.services for select using (true);
drop policy if exists "Users can create their own services" on public.services;
create policy "Users can create their own services" on public.services for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own services" on public.services;
create policy "Users can update their own services" on public.services for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own services" on public.services;
create policy "Users can delete their own services" on public.services for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Reviews are viewable by everyone" on public.reviews;
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
drop policy if exists "Users can create their own reviews" on public.reviews;
create policy "Users can create their own reviews" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own reviews" on public.reviews;
create policy "Users can update their own reviews" on public.reviews for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own reviews" on public.reviews;
create policy "Users can delete their own reviews" on public.reviews for delete to authenticated using (auth.uid() = user_id);

-- Cria o perfil automaticamente ao cadastrar um usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Dados fictícios de demonstração
-- ============================================================
INSERT INTO public.profiles (id,name,neighborhood,avatar_url) VALUES ('11111111-1111-4111-8111-000000000001','Carlos Andrade','Vila Mariana','https://i.pravatar.cc/150?img=12');
INSERT INTO public.profiles (id,name,neighborhood,avatar_url) VALUES ('11111111-1111-4111-8111-000000000002','Juliana Prado','Pinheiros','https://i.pravatar.cc/150?img=45');
INSERT INTO public.profiles (id,name,neighborhood,avatar_url) VALUES ('11111111-1111-4111-8111-000000000003','Marcos Vieira','Tatuapé','https://i.pravatar.cc/150?img=33');
INSERT INTO public.profiles (id,name,neighborhood,avatar_url) VALUES ('11111111-1111-4111-8111-000000000004','Renata Lopes','Moema','https://i.pravatar.cc/150?img=47');
INSERT INTO public.profiles (id,name,neighborhood,avatar_url) VALUES ('11111111-1111-4111-8111-000000000005','Fernanda Dias','Butantã','https://i.pravatar.cc/150?img=32');
INSERT INTO public.profiles (id,name,neighborhood,avatar_url) VALUES ('11111111-1111-4111-8111-000000000006','Paulo Menezes','Santana','https://i.pravatar.cc/150?img=15');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000001','Eletricista residencial 24h','Instalação de tomadas, chuveiros, quadros de energia e reparos elétricos em geral. Atendimento rápido no bairro.','Reformas','(11) 90000-0001','https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80&auto=format&fit=crop','2026-07-12 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000003','Pintura residencial sem sujeira','Pintura de paredes internas e externas, textura e massa corrida. Orçamento gratuito e material de primeira.','Reformas','(11) 90000-0002','https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80&auto=format&fit=crop','2026-07-14 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000002','Aulas particulares de matemática','Reforço escolar para ensino fundamental e médio, presencial ou online. Material de apoio incluso.','Aulas','(11) 90000-0003','https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=80&auto=format&fit=crop','2026-07-16 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000004','Aulas de violão para iniciantes','Aprenda seus primeiros acordes em casa. Aulas leves e personalizadas para todas as idades.','Aulas','(11) 90000-0004','https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&q=80&auto=format&fit=crop','2026-07-18 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000005','Marmitas caseiras congeladas','Comida caseira feita com carinho, porções individuais e cardápio semanal variado. Entrega no bairro.','Culinária','(11) 90000-0005','https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80&auto=format&fit=crop','2026-07-20 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-000000000002','Bolos e doces para festas','Bolos decorados, docinhos e tortas por encomenda. Sabores clássicos e opções sem lactose.','Culinária','(11) 90000-0006','https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=80&auto=format&fit=crop','2026-07-22 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000007','11111111-1111-4111-8111-000000000004','Cabeleireira a domicílio','Corte, escova, coloração e hidratação no conforto da sua casa. Agende pelo WhatsApp.','Beleza','(11) 90000-0007','https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80&auto=format&fit=crop','2026-07-24 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000008','11111111-1111-4111-8111-000000000005','Manicure e pedicure em casa','Unhas em gel, esmaltação tradicional e spa dos pés. Materiais esterilizados e higiene garantida.','Beleza','(11) 90000-0008','https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&q=80&auto=format&fit=crop','2026-07-26 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000009','11111111-1111-4111-8111-000000000006','Passeador de cães','Passeios diários com muito carinho e relatório com fotos. Vagas para pequenos e médios portes.','Pets','(11) 90000-0009','https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80&auto=format&fit=crop','2026-07-28 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000010','11111111-1111-4111-8111-000000000003','Banho e tosa em domicílio','Banho, tosa higiênica e corte de unhas sem estresse para o pet, tudo na porta da sua casa.','Pets','(11) 90000-0010','https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=1200&q=80&auto=format&fit=crop','2026-07-30 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000011','11111111-1111-4111-8111-000000000001','Faxina residencial completa','Limpeza pesada, organização e higienização de cozinha e banheiros. Produtos inclusos.','Limpeza','(11) 90000-0011','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80&auto=format&fit=crop','2026-08-01 17:05:31.121329+00');
INSERT INTO public.services (id,user_id,title,description,category,phone,image_url,created_at) VALUES ('22222222-2222-4222-8222-000000000012','11111111-1111-4111-8111-000000000006','Limpeza de vidros e janelas','Vidros, box e janelas impecáveis, inclusive em apartamentos altos com segurança.','Limpeza','(11) 90000-0012','https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200&q=80&auto=format&fit=crop','2026-08-03 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('3d9f65f0-4a38-45de-ab8f-cb02c76321ab','22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000006',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('39e46856-c689-4c35-8ca9-bb2c421e42ea','22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000004',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('6d3b7d92-cd24-431f-bd82-7c20f9e2a9b4','22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000002',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('00caeefd-fe56-41c0-8fc9-08fa434ba911','22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000005',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('019ae1db-b93e-4e99-8f52-5c62f7ed6c37','22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000001',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('30d7b165-fee8-437b-93e6-acbdadb921ad','22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000002',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('e55be663-8ada-4a02-a89a-de6f6f6ceb7d','22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000005',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('fad71bb9-ff9a-407a-be78-1a65eee01d00','22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000004',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('b4299b1f-e12f-4f39-9f39-33502a1aaf92','22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000006',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('bc962057-f593-4c1c-bb53-299106bab127','22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000005',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('b03e1e2c-efcb-456c-bdd1-119207b5f9a3','22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000003',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('4a6ed2f7-f3c8-45fa-8b77-e3ce16abedeb','22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000001',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('dfb69847-ae43-4eaa-bfb3-5891a9d47c33','22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000003',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('8fd45a89-b354-4f7a-99f8-506520147a41','22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000001',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('ace08aa8-2f00-4104-b29c-fd4b5c67b82d','22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000002',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('e8ee1f40-dc3d-40b1-81b4-91565bebe95a','22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000006',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('c310f7a3-3658-46a0-8a65-110c83ab2255','22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000004',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('14eaaf1b-07df-47e1-9529-51b20dab5393','22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000003',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('f648adb1-6535-4c9f-9e0b-66e2dd1a80e6','22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000001',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('6551c9d9-123d-4f6c-a721-5f6c7665d857','22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000006',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('7d9408a9-9ed8-4cac-91fe-9f3be5e02689','22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-000000000006',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('2ffbae7f-48c9-4ba3-b8b0-c48701f962c3','22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-000000000005',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('0f02a11b-3cde-431a-82e6-375641fcff17','22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-000000000004',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('13d97a6e-4687-40e4-ae43-ab473e73bd75','22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-000000000001',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('afe4833b-43cc-4922-a13d-30ecbee1b69f','22222222-2222-4222-8222-000000000007','11111111-1111-4111-8111-000000000002',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('554d4b74-b866-41a9-b50d-aa650ec7c1e2','22222222-2222-4222-8222-000000000007','11111111-1111-4111-8111-000000000003',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('51b82d29-499b-46db-bcf9-f17484f15703','22222222-2222-4222-8222-000000000007','11111111-1111-4111-8111-000000000005',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('96fd78ba-36b7-4881-a22e-21c211a32e25','22222222-2222-4222-8222-000000000007','11111111-1111-4111-8111-000000000006',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('ad9cd37b-41e9-4c28-9556-2b7af97cd2eb','22222222-2222-4222-8222-000000000008','11111111-1111-4111-8111-000000000001',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('25dbc5e6-5da9-4310-973f-65545328b0da','22222222-2222-4222-8222-000000000008','11111111-1111-4111-8111-000000000003',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('2cfa5884-b46b-46c2-9a52-8799f46438a1','22222222-2222-4222-8222-000000000008','11111111-1111-4111-8111-000000000002',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('fd67f336-f6c9-44cf-8b7b-f19f11c7b929','22222222-2222-4222-8222-000000000008','11111111-1111-4111-8111-000000000006',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('6d3813af-8760-4fed-8fcf-bba6037be509','22222222-2222-4222-8222-000000000009','11111111-1111-4111-8111-000000000003',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('32ce6ea7-04d0-467e-81c3-df3a547004fc','22222222-2222-4222-8222-000000000009','11111111-1111-4111-8111-000000000002',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('94de2b8c-2d1e-4dee-942d-cc8b95b042f0','22222222-2222-4222-8222-000000000009','11111111-1111-4111-8111-000000000005',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('bb28cc80-3dce-43ac-8cb9-4ddd2c5080ba','22222222-2222-4222-8222-000000000009','11111111-1111-4111-8111-000000000004',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('b4faffc1-3fdd-45b5-92e0-eb25b60f5859','22222222-2222-4222-8222-000000000010','11111111-1111-4111-8111-000000000002',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('2e5fc693-26f8-4e21-8241-f0ea9b3110f3','22222222-2222-4222-8222-000000000010','11111111-1111-4111-8111-000000000006',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('3d39c7e3-4e24-4bcb-8af9-8709b3353383','22222222-2222-4222-8222-000000000010','11111111-1111-4111-8111-000000000001',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('03e7100c-3b00-4f3a-9089-00d644742c12','22222222-2222-4222-8222-000000000010','11111111-1111-4111-8111-000000000005',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('2fa8d657-68e2-44ff-8913-8725d6740fa9','22222222-2222-4222-8222-000000000011','11111111-1111-4111-8111-000000000002',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('a03f85f4-d546-43c0-a0a4-fd2d9093496c','22222222-2222-4222-8222-000000000011','11111111-1111-4111-8111-000000000003',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('a7bbd297-2734-4d72-b4d3-85ef8b550421','22222222-2222-4222-8222-000000000011','11111111-1111-4111-8111-000000000006',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('0b7c157f-9142-4611-86ff-401d515a56c6','22222222-2222-4222-8222-000000000011','11111111-1111-4111-8111-000000000004',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('ef1bbee4-b73d-49e0-9560-c0551cacd714','22222222-2222-4222-8222-000000000012','11111111-1111-4111-8111-000000000003',5,'Serviço impecável, super recomendo!','2026-08-04 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('b61eff4d-ead1-48ef-a161-f78ee7c36a07','22222222-2222-4222-8222-000000000012','11111111-1111-4111-8111-000000000004',5,'Muito atencioso e pontual.','2026-08-05 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('1789a4cc-f382-4112-8d3d-816aa6d2a693','22222222-2222-4222-8222-000000000012','11111111-1111-4111-8111-000000000005',4,'Ótimo custo-benefício, voltarei a contratar.','2026-08-06 17:05:31.121329+00');
INSERT INTO public.reviews (id,service_id,user_id,rating,comment,created_at) VALUES ('b7a0edca-d657-460c-9628-6696f8b079b9','22222222-2222-4222-8222-000000000012','11111111-1111-4111-8111-000000000002',5,'Trabalho caprichado e profissional.','2026-08-07 17:05:31.121329+00');
