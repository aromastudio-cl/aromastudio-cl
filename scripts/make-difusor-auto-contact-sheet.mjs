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

const thumbWidth = 270;
const thumbHeight = 338;
const labelHeight = 38;
const columns = 4;
const rows = Math.ceil(slugs.length / columns);
const directory = process.argv[2] ?? "art-direction/premium-final";
const output = process.argv[3] ?? "art-direction/review/difusor-auto-contact-sheet-premium-final.jpg";

const composites = [];
for (const [index, slug] of slugs.entries()) {
  const left = (index % columns) * thumbWidth;
  const top = Math.floor(index / columns) * (thumbHeight + labelHeight);
  const image = await sharp(`${directory}/${slug}.webp`)
    .resize(thumbWidth, thumbHeight, { fit: "cover" })
    .toBuffer();
  const label = Buffer.from(`<svg width="${thumbWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#181512"/>
    <text x="${thumbWidth / 2}" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" letter-spacing="1.2" fill="#fff">${slug.toUpperCase()}</text>
  </svg>`);
  composites.push({ input: image, left, top });
  composites.push({ input: label, left, top: top + thumbHeight });
}

await sharp({
  create: {
    width: columns * thumbWidth,
    height: rows * (thumbHeight + labelHeight),
    channels: 3,
    background: "#eee9e2",
  },
})
  .composite(composites)
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(output);

console.log(output);
