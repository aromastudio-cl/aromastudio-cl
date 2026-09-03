import sharp from "sharp";

const slugs = [
  "bubble-gum",
  "cedron-limon-menta",
  "fig-no-7",
  "green-elixir",
  "infinity",
  "mango",
  "manzana-canela",
  "noir-coffee",
  "red-velvet",
  "soleil-blanc",
  "verbena",
];

const directory = process.argv[2] ?? "art-direction/premium-final";

for (const slug of slugs) {
  const source = `${directory}/${slug}.png`;
  const output = `${directory}/${slug}.webp`;
  await sharp(source)
    .resize({ width: 900, height: 1125, fit: "cover", position: "centre" })
    .webp({ quality: 84, effort: 6, smartSubsample: true })
    .toFile(output);
  console.log(output);
}
