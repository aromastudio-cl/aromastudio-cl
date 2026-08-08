import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";

const generatedRoot = "C:/Users/jorge/.codex/generated_images/019fdcb1-c96f-7da3-a44c-bc65cf0f0a91";
const outputRoot = path.resolve("public/products/generated");
const items = [
  ["9cd9d9fa-d09b-4474-a00a-0262999d6895", "home-spray-bubble-gum", "exec-11c9debf-b229-462c-8bd9-3ccd28fb5523.png"],
  ["67563320-0559-4600-86b7-ee86c24f1493", "home-spray-cedron-limon-menta", "exec-964f71bb-f632-4d31-975e-73588c2e9cb0.png"],
  ["72821ba7-f1aa-4e96-8557-23dc677c0fac", "home-spray-fig-7", "exec-7183c0f8-27af-4f37-bb07-23131f8c71d6.png"],
  ["bfd9fa93-6ecd-408a-b953-345472431849", "home-spray-green-elixir", "exec-9372802e-8e7f-4a43-9446-aaac93e11442.png"],
  ["195ce076-20fd-4a2b-b5e8-eebbca9c3121", "home-spray-infinity", "exec-7e95e477-5f32-4035-979d-b639fe27e00a.png"],
  ["f430c9ef-84d7-4a6e-8865-98f2cc72f6f5", "home-spray-mango", "exec-7e6f70a4-d5c1-48b5-8502-a23d6ffe938c.png"],
  ["0bca8caf-7294-41fb-bac5-131cb23980c5", "home-spray-manzana-canela", "exec-95eae935-5426-475d-b1c1-42c8118cce40.png"],
  ["bbe95c55-6e8b-4fc4-b6db-793bb32103ca", "home-spray-noir-coffee", "exec-b6ec17b9-d86d-4284-a9eb-5ecde94bdab1.png"],
  ["7a92101e-3c3a-4417-87a9-12a8a1dfe901", "home-spray-red-velvet", "exec-536a6800-e4c9-474f-9376-241aa0108ece.png"],
  ["0b0cafb1-6ded-4c6d-9eb1-7261cd3b5507", "home-spray-soleil-blanc", "exec-e4b35d1c-63bd-4aba-bea4-a35411676907.png"],
  ["349e4cb1-11ed-4d78-91bb-e198f63b0447", "home-spray-verbena", "exec-1336a7f4-4265-490e-9694-b74e0ea40f01.png"],
  ["5a632b2f-15cc-40fc-8379-090eb4fe3b25", "mikados-varilla-mango", "exec-474a4ce7-d55e-4925-9753-574d22e96920.png"],
  ["8f724970-160b-4169-af8d-9e7f0bcbd37e", "mikados-varilla-bubble-gum", "exec-ccebd889-a7e0-47de-83ff-c6e5582b6e48.png"],
  ["c3bfaf32-6d9f-4a3e-93f8-05a05aab41e5", "mikados-varilla-verbena", "exec-0b7c77c7-aaee-4fac-8438-62b8a59aa4f0.png"],
  ["53757f7f-3292-4c07-8b96-b27ec4bc8d67", "mikados-varilla-cedron-limon-menta", "exec-5c09e866-0cea-48a6-b5b1-b7676fdeca5c.png"],
  ["c2fe6341-b58b-466b-ad9b-bee70042997e", "mikados-varilla-red-velvet", "exec-4866406d-d5c3-44b3-b8e3-f90470ae4cb3.png"],
  ["0f9492c6-9807-453c-a0ab-0e2561e091f5", "mikados-varilla-infinity", "exec-62cbff4f-1de5-494f-a085-837356e2536b.png"],
  ["46a7e5b6-14e7-48ee-acf2-3d4e0c983292", "mikados-varilla-green-elixir", "exec-026fbc4d-8543-41a7-9b47-ce779639e50c.png"],
  ["9a8fd232-e628-4268-a3fa-dd0bcf496b80", "mikados-varilla-manzana-canela", "exec-6d1bfc79-e706-4b3c-9f29-aaa804faec80.png"],
  ["1e5ee7af-50b2-4e84-b0ad-ab60b22ac02d", "mikados-varilla-noir-coffee", "exec-175e5c11-af58-46dd-808b-f1186677b1f5.png"],
  ["e015e167-3110-43b2-a10b-cf3521404d06", "mikados-varilla-fig-7", "exec-22380bb9-0196-4eef-8ff9-2d5a9099904f.png"],
  ["d88929c4-621e-461c-b9c2-5188437cf262", "mikados-varilla-soleil-blanc", "exec-74c5a444-7582-4bcb-b494-d12b48d898c9.png"],
  ["9375eb25-3cb2-4e76-bf83-be5807629613", "difusor-auto-bubble-gum", "exec-24b7f710-5831-4001-ab22-3e79439a893e.png"],
  ["01308b11-6391-4027-b49a-caf34e103860", "difusor-auto-cedron-limon-menta", "exec-b3a887a8-e5eb-4649-abcc-963ffa7f1290.png"],
  ["8bf5a20a-d7da-4718-9154-492e8f7d5c53", "difusor-auto-fig-7", "exec-70df7974-bb8e-4efc-8b2f-fbf97d7ec42b.png"],
  ["d939f13f-84ce-482b-9242-37e2f1dbf09f", "difusor-auto-green-elixir", "exec-f3fed966-e18e-4cbd-9029-77241e06f688.png"],
  ["a4478f5c-2e47-4161-97d7-2c9f3fe2884f", "difusor-auto-infinity", "exec-f96912af-a02e-4197-8e0a-0713f0b9dc98.png"],
  ["0f77586a-b1da-446c-a22c-30d072dc939a", "difusor-auto-mango", "exec-1f945303-f87a-4603-afbc-7d6b76c6052a.png"],
  ["6bfba72c-58f4-4431-820f-2bca8909e034", "difusor-auto-manzana-canela", "exec-89f4999e-8b05-486d-885c-5b6f01436812.png"],
  ["c8e194cd-f3a3-44ae-8f4b-3678142d9ecb", "difusor-auto-noir-coffee", "exec-0a337c88-f8d5-4c96-86f3-8e7c1438d051.png"],
  ["8f3a9370-50fc-49af-bda0-62f3122d8e1b", "difusor-auto-red-velvet", "exec-dfd161d3-6cc3-4d3b-afd8-8a8280615a0a.png"],
  ["4b0417d5-bccd-4625-9bb5-c2b042ef1c91", "difusor-auto-soleil-blanc", "exec-d5287202-d5b3-4267-a7af-4e2d71a87e4a.png"],
  ["3e94e57b-1404-4017-966d-e8c5a6de3aed", "difusor-auto-verbena", "exec-ab24e2c9-1e44-4826-93e9-9bdd4e148147.png"],
  ["574f5107-df33-41d0-8760-123f3b448c61", "esencias-puras-bubble-gum", "exec-d944b38b-0fd3-4b9c-a898-42be36da96e0.png"],
  ["885f85af-c54d-44d8-8255-7b5bbbeb1150", "esencias-puras-cedron-limon-menta", "exec-7a8f979b-06aa-4ee5-b510-c2dd6ebbcf49.png"],
  ["74baa7c7-45ff-4c43-9aa8-78df4f2f6877", "esencias-puras-fig-7", "exec-d1248b8c-5888-449d-84ab-68461e170031.png"],
  ["0ce08f27-6bc9-4ef0-9bdf-4429907b783b", "esencias-puras-green-elixir", "exec-1964b9d5-a94e-4788-97c2-fdaae2975299.png"],
  ["94945753-d30f-4b1d-9a64-d76fe0dd985d", "esencias-puras-infinity", "exec-e5b278c9-fef1-4ba9-af3f-8f3292e10a94.png"],
  ["06d66118-2f94-4444-a31f-41d2b0a16c43", "esencias-puras-mango", "exec-7f58f365-490c-4620-bf43-1806e08b939f.png"],
  ["5173f313-bb7a-43bd-b628-4c1a346986a1", "esencias-puras-manzana-canela", "exec-01fc4555-7104-4f96-a844-56ddc149254d.png"],
  ["9aa37a27-bd2e-4cf9-9951-fa58cfb01cc7", "esencias-puras-noir-coffee", "exec-fa3deb40-12c9-4dd6-9c1e-7bcdd231fdb5.png"],
  ["badae889-0f35-47c8-9cdc-44e5ecd7b00b", "esencias-puras-red-velvet", "exec-5c275dda-67af-48e9-b74f-e86454e967da.png"],
  ["a711f225-445e-4e69-b8e6-f129c7e24f6a", "esencias-puras-soleil-blanc", "exec-8f78120f-f5b9-4f10-a336-237db5e5ab3a.png"],
  ["45316b15-9dd6-42df-9a0c-2f080a954bce", "esencias-puras-verbena", "exec-ac7a0b90-142a-4d3e-943d-89109286667e.png"],
  ["9b9eeaf5-9098-4a08-8acf-27ece83f4ee0", "humidificadores-bubble-gum", "exec-b156d32e-c2a3-435d-9210-f9715d664b10.png"],
  ["54d9a5b6-2576-42bc-92ee-226daa13382f", "humidificadores-cedron-limon-menta", "exec-407c398b-73c0-4586-9a02-c7e46376d251.png"],
  ["67f47887-c0ee-4392-bb8c-6c9ccc075048", "humidificadores-fig-7", "exec-f9b89e9f-c40f-4ea5-a6a9-5e2362fc6c9f.png"],
  ["7ad66fc9-be85-4bd0-9644-b6d9c81eae7d", "humidificadores-green-elixir", "exec-e94a0824-1409-4345-ad14-030683a4d0dd.png"],
  ["0bbaaec2-87b2-4ea6-9d2c-e34ecce0c62e", "humidificadores-infinity", "exec-41ac9e67-298e-4908-904d-5a3733f0d20b.png"],
  ["10a70718-193b-4aad-842f-a90a47f1e1b3", "humidificadores-mango", "exec-b536aca0-0666-4de4-b07e-69dc09d1923f.png"],
  ["88399dba-8e0a-44eb-b8e5-ee9a35fcfc1a", "humidificadores-manzana-canela", "exec-de3e4bf6-0c68-47b0-a6f1-38c51a2d3f6e.png"],
  ["edca0e44-3845-4e24-9a49-4d079a7b902d", "humidificadores-noir-coffee", "exec-5563b604-96e2-4395-8622-0acdece636e9.png"],
  ["f28fffdd-5cb8-4b33-a43a-be703b9d6995", "humidificadores-red-velvet", "exec-7bf75419-fb8e-4c1b-8770-a20cd2d0e181.png"],
  ["4727223b-93d4-4d78-aa97-3a2e55bce07b", "humidificadores-soleil-blanc", "exec-e9826958-cbba-4619-bd63-77481fd1f0db.png"],
  ["20b368e9-03fb-453d-817f-90c7299f3bd2", "humidificadores-verbena", "exec-947902ab-2209-4e97-829b-ce76f97e0611.png"],
];

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltan credenciales Supabase");
const supabase = createClient(url, key, { auth: { persistSession: false } });
await mkdir(outputRoot, { recursive: true });

for (const [productId, slug, sourceName] of items) {
  const source = path.join(generatedRoot, sourceName);
  const output = path.join(outputRoot, `${slug}.webp`);
  await sharp(await readFile(source))
    .resize(1100, 1100, { fit: "cover" })
    .webp({ quality: 84, effort: 5 })
    .toFile(output);
  const storagePath = `${productId}/${slug}.webp`;
  const bytes = await readFile(output);
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, bytes, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
  if (uploadError) throw uploadError;
  const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(storagePath);
  await supabase.from("product_images").delete().eq("product_id", productId).eq("is_primary", true);
  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    image_url: publicUrl.publicUrl,
    storage_path: storagePath,
    alt_text: `${slug.replaceAll("-", " ")} de Aroma Studio`,
    sort_order: 1,
    is_primary: true,
    active: true,
  });
  if (insertError) throw insertError;
  console.log(`OK ${slug} (${Math.round(bytes.length / 1024)} KB)`);
}
