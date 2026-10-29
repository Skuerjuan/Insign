import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const build='media/tutorial/build/recorrido';
const captures=build+'/captures';
const guide=JSON.parse(fs.readFileSync('media/tutorial/guion-recorrido.json','utf8'));
const shots=JSON.parse(fs.readFileSync(captures+'/shots.json','utf8'));
const groups=[['00-landing'],['01-cuenta'],['02-niveles','02b-juegos'],['03a-eleccion','03b-memoria','03c-completar','03d-multiple'],['04-entrenamiento'],['05a-abecedario','05b-letras-video'],['06-progreso'],['07-perfil'],['08-configuracion','09-cierre']];
const mascots=['loro-saludando.png','loro-ayuda.png','loro-explorador.png','loro-contrasena.png','loro-practicar.png','loro-saludando.png','loro-mango.png','loro-mango.png','loro-volando.png'];
const stamp=t=>{const n=Math.round(t*1000);return `${String(Math.floor(n/3600000)).padStart(2,'0')}:${String(Math.floor(n/60000)%60).padStart(2,'0')}:${String(Math.floor(n/1000)%60).padStart(2,'0')}.${String(n%1000).padStart(3,'0')}`;};
const assStamp=t=>stamp(t).slice(0,-1);
const run=(cmd,args)=>new Promise((resolve,reject)=>{const child=spawn(cmd,args,{windowsHide:true});let err='';child.stderr.on('data',d=>{err+=d;});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(err.slice(-5000))));});
function panel(i){return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
<rect x="1280" width="160" height="810" fill="#0753a1"/>
<rect y="720" width="1440" height="90" fill="#06254b"/>
<g font-family="Arial,sans-serif" text-anchor="middle">
<text x="1360" y="52" font-size="29" font-weight="900" fill="white">In<tspan fill="#ffd32a">Sign</tspan></text>
<text x="1360" y="82" font-size="15" fill="#d0eaff">Recorrido guiado</text>
<text x="1360" y="135" font-size="23" font-weight="bold" fill="#ffd32a">${String(i+1).padStart(2,'0')} / 09</text>
${Array.from({length:9},(_,j)=>`<circle cx="1360" cy="${210+j*30}" r="${j===i?7:4}" fill="${j===i?'#ffd32a':'#ffffff55'}"/>`).join('')}
<text x="1360" y="703" font-size="24" font-weight="bold" fill="#ffd32a">Waki</text>
<text x="1360" y="754" font-size="12" fill="#c9dcee">Datos de</text><text x="1360" y="772" font-size="12" fill="#c9dcee">demostración</text>
</g><rect y="805" width="${1440*(i+1)/9}" height="5" fill="#ffd32a"/></svg>`;}

fs.mkdirSync('output/video',{recursive:true});
fs.mkdirSync('public/recorrido-waki',{recursive:true});
let globalTime=0,webvtt='WEBVTT\n\n',chaptersVtt='WEBVTT\n\n';
const timing=[];
const assHeader=`[Script Info]\nScriptType: v4.00+\nPlayResX: 1440\nPlayResY: 810\nWrapStyle: 0\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Default,Arial,27,&H00FFFFFF,&H00FFFFFF,&H004B2506,&H004B2506,0,0,0,0,100,100,0,0,1,1,0,2,45,205,24,1\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n`;
for(const [index,group]of groups.entries()){
  const id=String(index).padStart(2,'0');
  const chapter=guide.chapters[index];
  let duration=0,frames=[];
  for(const name of group){
    const shot=shots.find(x=>x.name===name);
    if(!shot||shot.frames<2||shot.times.length!==shot.frames)throw Error('Incomplete recording: '+name);
    for(let f=0;f<shot.frames;f++){
      const filename=path.resolve(captures,name,String(f).padStart(5,'0')+'.png').replaceAll('\\','/');
      if(!fs.existsSync(filename))throw Error('Missing recording frame: '+filename);
      const interval=f+1<shot.frames?shot.times[f+1]-shot.times[f]:shot.seconds-shot.times[f];
      frames.push(`file '${filename}'\nduration ${Math.max(.001,interval).toFixed(6)}`);
    }
    duration+=shot.seconds;
  }
  const last=frames.at(-1).split('\n')[0];
  fs.writeFileSync(`${build}/${id}-capture.ffconcat`,'ffconcat version 1.0\n'+frames.join('\n')+'\n'+last+'\n');
  const audio=`${build}/${id}.wav`;
  const audioDuration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',audio],{encoding:'utf8'}).trim());
  if(audioDuration+.3>duration)throw Error('Narration does not fit: '+chapter.section);
  const length=Math.ceil(duration*24)/24;
  if(globalTime+length>90)throw Error('Video exceeds the requested 90 seconds');
  await sharp(Buffer.from(panel(index))).png().toFile(`${build}/${id}-panel.png`);
  await sharp('public/'+mascots[index]).resize(144,154,{fit:'contain',background:'#00000000'}).png().toFile(`${build}/${id}-waki.png`);
  let ass=assHeader;
  const words=chapter.speech.split(/\s+/);
  for(let w=0;w<words.length;w+=12){
    const text=words.slice(w,w+12).join(' ');
    const start=.3+audioDuration*w/words.length,end=.3+audioDuration*Math.min(w+12,words.length)/words.length;
    ass+=`Dialogue: 0,${assStamp(start)},${assStamp(end)},Default,,0,0,0,,${text}\n`;
    webvtt+=`${stamp(globalTime+start)} --> ${stamp(globalTime+end)}\n${text}\n\n`;
  }
  fs.writeFileSync(`${build}/${id}-tour.ass`,ass);
  const filter=`[0:v]fps=24,format=rgba,pad=1440:810:0:0:color=0x0753a1[screen];[screen][1:v]overlay=0:0:shortest=1[branded];[branded][2:v]overlay=x=1288:y='535+3*sin(t*2.5)':shortest=1,ass=${build}/${id}-tour.ass,format=yuv420p[v];[3:a]loudnorm=I=-16:TP=-1.5:LRA=11,adelay=300:all=1,apad[a]`;
  await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-safe','0','-i',`${build}/${id}-capture.ffconcat`,'-loop','1','-framerate','24','-i',`${build}/${id}-panel.png`,'-loop','1','-framerate','24','-i',`${build}/${id}-waki.png`,'-i',audio,'-filter_complex',filter,'-map','[v]','-map','[a]','-t',String(length),'-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-r','24','-c:a','aac','-ar','48000','-ac','2','-b:a','128k',`${build}/${id}-tour.mp4`]);
  timing.push({section:chapter.section,start:globalTime,end:globalTime+length,recordings:group});
  chaptersVtt+=`${index+1}\n${stamp(globalTime)} --> ${stamp(globalTime+length)}\n${chapter.section}\n\n`;
  globalTime+=length;
  console.log(`${index+1}/9: ${chapter.section} (${length.toFixed(2)} s)`);
}
fs.writeFileSync(`${build}/tour-concat.txt`,groups.map((_,i)=>`file '${String(i).padStart(2,'0')}-tour.mp4'`).join('\n'));
let metadata=';FFMETADATA1\ntitle=InSign: recorrido con Waki\ncomment=Captura de las pantallas reales de InSign con datos de demostración, narración en español y subtítulos\n';
for(const c of timing)metadata+=`[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(c.start*1000)}\nEND=${Math.round(c.end*1000)}\ntitle=${c.section}\n`;
fs.writeFileSync(`${build}/tour-metadata.txt`,metadata);
const final='output/video/insign-recorrido-waki.mp4';
await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',`${build}/tour-concat.txt`,'-i',`${build}/tour-metadata.txt`,'-map_metadata','1','-map_chapters','1','-c','copy','-movflags','+faststart',final]);
const actualDuration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',final],{encoding:'utf8'}).trim());
if(actualDuration>90)throw Error('Final video exceeds 90 seconds');
fs.copyFileSync(final,'public/grabacion-insign.mp4');
fs.writeFileSync('public/recorrido-waki/subtitulos.vtt',webvtt);
fs.writeFileSync('public/recorrido-waki/capitulos.vtt',chaptersVtt);
fs.writeFileSync('public/recorrido-waki/transcripcion.txt',guide.chapters.map(c=>c.section+'\n'+c.speech).join('\n\n')+'\n');
await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss','3','-i',final,'-frames:v','1','public/recorrido-waki/portada.jpg']);
fs.writeFileSync('media/tutorial/tiempos-recorrido.json',JSON.stringify({duration:actualDuration,format:'screen recording',syntheticProfile:true,chapters:timing},null,2)+'\n');
console.log(`Listo: ${actualDuration.toFixed(2)} segundos. ${final}`);
