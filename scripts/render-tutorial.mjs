import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn, execFileSync} from 'node:child_process';
import sharp from 'sharp';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const chapters = JSON.parse(fs.readFileSync('media/tutorial/guion.json', 'utf8'));
const build = 'media/tutorial/build';
const published = 'public/tutorial-insign';
fs.mkdirSync(build, {recursive:true});
fs.mkdirSync(published, {recursive:true});
const xml = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const stamp = (seconds, separator='.') => {
  const ms = Math.round(seconds*1000);
  return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}${separator}${String(ms%1000).padStart(3,'0')}`;
};
const assStamp = t => stamp(t).slice(0,-1);
function run(command, args) {
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{windowsHide:true});
    let error=''; child.stderr.on('data',d=>{error+=d;});
    child.on('error',reject);
    child.on('exit',code=>code===0?resolve():reject(Error(`${command} failed (${code}): ${error.slice(-5000)}`)));
  });
}
function svg(chapter,index) {
  return `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#063d94"/><stop offset="1" stop-color="#0a74d9"/></linearGradient></defs>
    <rect width="1280" height="720" fill="url(#bg)"/>
    <circle cx="1160" cy="290" r="240" fill="#2389e0"/><circle cx="1250" cy="520" r="170" fill="#1475cc"/>
    <path d="M0 540 Q340 470 680 560 T1280 540V720H0Z" fill="#053a80" opacity=".5"/>
    <g font-family="Arial, sans-serif">
      <text x="52" y="50" fill="#c7e7ff" font-size="19" font-weight="bold" letter-spacing="3">RECORRIDO GUIADO · ${String(index+1).padStart(2,'0')} / ${chapters.length}</text>
      <text x="1068" y="52" fill="white" font-size="36" font-weight="bold">In<tspan fill="#ffdd38">Sign</tspan></text>
      <text x="52" y="111" fill="#ffdd38" font-size="22" font-weight="bold">${xml(chapter.tag)}</text>
      <text x="52" y="170" fill="white" font-size="52" font-weight="bold">${xml(chapter.title)}</text>
      <rect x="52" y="205" width="780" height="330" rx="30" fill="#f8fcff"/>
      ${chapter.items.map((text,i)=>`<circle cx="87" cy="${253+i*76}" r="8" fill="#ffbd34"/><text x="111" y="${262+i*76}" fill="#07376c" font-size="24" font-weight="bold">${xml(text)}</text>`).join('')}
      <rect x="52" y="556" width="780" height="37" rx="18" fill="#ffffff19"/>
      <text x="72" y="581" fill="#e1f2ff" font-size="18">Observá · Practicá · Jugá · Aprendé</text>
    </g>
    <rect y="611" width="1280" height="109" fill="#02234f"/>
    <rect x="52" y="703" width="1176" height="5" rx="2" fill="#ffffff22"/>
    <rect x="52" y="703" width="${1176*(index+1)/chapters.length}" height="5" rx="2" fill="#ffdb35"/>
  </svg>`;
}

(async()=>{
  let total=0, subtitles='WEBVTT\n\n', chapterTrack='WEBVTT\n\n';
  const timings=[];
  const assHeader = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\nWrapStyle: 0\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,27,&H00FFFFFF,&H00FFFFFF,&H00482002,&H00482002,0,0,0,0,100,100,0,0,1,1,0,2,72,72,41,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  for (const [index,chapter] of chapters.entries()) {
    const id=String(index).padStart(2,'0');
    const audio=`${build}/${id}.wav`;
    const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',audio],{encoding:'utf8'}).trim());
    const length=Math.ceil((duration+1.1)*24)/24;
    timings.push({title:chapter.title,start:total,end:total+length,duration:length});
    chapterTrack+=`${index+1}\n${stamp(total)} --> ${stamp(total+length)}\n${chapter.title}\n\n`;
    await sharp(Buffer.from(svg(chapter,index))).png().toFile(`${build}/${id}.png`);
    const parrot=await sharp(`public/${chapter.mascot}`).resize(350,355,{fit:'contain',background:'#00000000'}).png().toBuffer();
    await sharp(parrot).toFile(`${build}/${id}-loro.png`);
    if(index===0) await sharp(`${build}/${id}.png`).composite([{input:parrot,left:875,top:230}]).jpeg({quality:90}).toFile(`${published}/poster.jpg`);
    const words=chapter.speech.split(/\s+/);
    let ass=assHeader;
    for(let w=0;w<words.length;w+=13){
      const chunk=words.slice(w,w+13).join(' ');
      const start=.5+duration*w/words.length;
      const end=.5+duration*Math.min(w+13,words.length)/words.length;
      subtitles+=`${stamp(total+start)} --> ${stamp(total+end)}\n${chunk}\n\n`;
      ass+=`Dialogue: 0,${assStamp(start)},${assStamp(end)},Default,,0,0,0,,${chunk}\n`;
    }
    fs.writeFileSync(`${build}/${id}.ass`,ass);
    const filter=`[0:v][1:v]overlay=x='875+7*sin(1.2*t)':y='230+8*sin(2.2*t)':shortest=1,ass=${build}/${id}.ass,fade=t=in:d=0.3,fade=t=out:st=${length-.3}:d=0.3[v];[2:a]adelay=500:all=1,apad,alimiter=limit=0.95[a]`;
    await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-loop','1','-framerate','24','-i',`${build}/${id}.png`,'-loop','1','-framerate','24','-i',`${build}/${id}-loro.png`,'-i',audio,'-filter_complex',filter,'-map','[v]','-map','[a]','-t',String(length),'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-r','24','-c:a','aac','-ar','48000','-ac','2','-b:a','128k',`${build}/${id}.mp4`]);
    total+=length;
    console.log(`Video: ${index+1}/${chapters.length} · ${chapter.title} · ${length.toFixed(1)} s`);
  }
  fs.writeFileSync(`${build}/concat.txt`,chapters.map((_,i)=>`file '${String(i).padStart(2,'0')}.mp4'`).join('\n'));
  let metadata=';FFMETADATA1\ntitle=Cómo funciona InSign\ncomment=Tutorial con el loro, voz en español y subtítulos\n';
  for(const chapter of timings)metadata+=`[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(chapter.start*1000)}\nEND=${Math.round(chapter.end*1000)}\ntitle=${chapter.title}\n`;
  fs.writeFileSync(`${build}/chapters.txt`,metadata);
  await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',`${build}/concat.txt`,'-i',`${build}/chapters.txt`,'-map_metadata','1','-map_chapters','1','-c','copy','-movflags','+faststart','public/tutorial-insign.mp4']);
  fs.writeFileSync(`${published}/subtitulos.vtt`,subtitles);
  fs.writeFileSync(`${published}/capitulos.vtt`,chapterTrack);
  fs.writeFileSync('media/tutorial/timings.json',JSON.stringify({duration:total,chapters:timings},null,2)+'\n');
  fs.writeFileSync(`${published}/transcripcion.txt`,chapters.map(c=>c.title+'\n'+c.speech).join('\n\n')+'\n');
  console.log(`Tutorial listo: ${total.toFixed(1)} s, ${chapters.length} capítulos.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
