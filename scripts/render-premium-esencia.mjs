import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { officialScentLabels as catalog } from "./official-scent-labels.mjs";

const slug=process.argv[2], volume="10";
const item=catalog[slug]; if(!item) throw new Error(`Aroma no soportado: ${slug}`);
const [name,notes]=item, w=260,h=340;
const base=`art-direction/candidates/esencias-puras-${slug}-base.png`;
const out=`art-direction/candidates/esencias-puras-${slug}-10-premium`;

const src=await readFile("public/logo.png");
const raster=sharp(src).resize({width:82,height:76,fit:"contain"});
const {data,info}=await raster.ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let i=0;i<data.length;i+=4){const d=255-Math.round((data[i]+data[i+1]+data[i+2])/3);data[i]=23;data[i+1]=19;data[i+2]=15;data[i+3]=d<90?0:Math.min(255,(d-90)*2.1)}
const logo=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
const paper=await sharp("scripts/assets/label-background.png").resize(w,h,{fit:"fill"}).png().toBuffer();
const mask=Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><path d="M4 6 Q130 0 256 6 L256 332 Q130 340 4 332 Z" fill="white"/></svg>`);
const wrapped=await sharp(paper).composite([{input:mask,blend:"dest-in"}]).png().toBuffer();
const titleSize=name.length>19?16:name.length>14?20:25;
const noteSize=notes.length>2?7.2:9;
const art=Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="g"><stop stop-color="#6c4a2c" stop-opacity=".14"/><stop offset=".15" stop-color="white" stop-opacity="0"/><stop offset=".84" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="#6c4a2c" stop-opacity=".16"/></linearGradient></defs>
<text x="130" y="128" text-anchor="middle" font-family="Georgia,serif" font-size="${titleSize}" fill="#18130f">${name}</text>
<line x1="34" y1="145" x2="226" y2="145" stroke="#b58a51" stroke-width=".8"/>
<text x="130" y="162" text-anchor="middle" font-family="Arial,sans-serif" font-size="6.5" letter-spacing="1.5" fill="#30261f">LUXURY HOME FRAGRANCE</text>
<text x="130" y="198" text-anchor="middle" font-family="Georgia,serif" font-size="${noteSize}" fill="#211a15">${notes.map((n,i)=>`<tspan x="130" dy="${i?13:0}">${n}</tspan>`).join("")}</text>
<text x="130" y="275" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#211a15">Esencia Pura</text>
<text x="130" y="296" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" letter-spacing="2">10 ml</text>
<text x="130" y="318" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" fill="#211a15">www.aromastudio.cl</text>
<path d="M4 6 Q130 0 256 6 L256 332 Q130 340 4 332 Z" fill="url(#g)"/></svg>`);
const label=await sharp(wrapped).composite([{input:logo,left:89,top:22},{input:art,left:0,top:0}]).png().toBuffer();
const final=await sharp(base).composite([{input:label,left:431,top:734}]).png().toBuffer();
await sharp(final).png({compressionLevel:9}).toFile(`${out}.png`);
await sharp(final).resize({width:900,height:1125,fit:"cover"}).webp({quality:87,effort:6,smartSubsample:true}).toFile(`${out}.webp`);
console.log(`${out}.webp`);
