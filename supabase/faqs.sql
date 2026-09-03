create table if not exists public.faqs (
 id uuid primary key default gen_random_uuid(), question text not null, answer text not null,
 active boolean not null default true, sort_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.faqs enable row level security;
drop policy if exists "Preguntas públicas" on public.faqs;
drop policy if exists "Administradores gestionan preguntas" on public.faqs;
create policy "Preguntas públicas" on public.faqs for select to anon, authenticated using (active=true or auth.role()='authenticated');
create policy "Administradores gestionan preguntas" on public.faqs for all to authenticated using(true) with check(true);
insert into public.faqs(question,answer,sort_order) select * from (values
('¿Qué aroma me recomiendan si es mi primera compra?','Nuestro best seller es Mango Cream: dulce, frutal y luminoso. Si prefieres algo más cálido prueba Abrazo de Invierno, y si buscas frescura total, Lemonti.',1),
('¿El Home Spray mancha la ropa o los textiles?','Úsalo a una distancia mínima de 30 cm. Recomendamos probar primero en una zona poco visible y evitar aplicarlo directamente sobre telas delicadas.',2),
('¿Cómo funciona el difusor de varillas?','Las varillas absorben la fragancia y la liberan gradualmente. Gíralas una o dos veces por semana para intensificar el aroma.',3),
('¿Qué es el refill de 1 litro?','Es un formato de recarga que permite rellenar varias veces tus envases, reducir residuos y disfrutar tu aroma favorito por más tiempo.',4),
('¿Cómo uso la esencia fragancia pura?','Agrega pocas gotas en un difusor eléctrico o humidificador compatible y ajusta la intensidad según el tamaño del espacio.',5),
('¿Los productos son veganos?','Consulta la información específica de cada producto. Si necesitas orientación sobre una fórmula, escríbenos antes de comprar.',6),
('¿Realizan envíos a todo Chile?','Sí, despachamos a todo Chile. El plazo y costo se calculan según la comuna y se informan durante la compra.',7)
) as seed(question,answer,sort_order) where not exists(select 1 from public.faqs);
