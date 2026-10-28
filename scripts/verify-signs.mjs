import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import crypto from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/diccionario/videos.json'), 'utf8'));
function load(file) {
  const evaluatedModule = {exports:{}};
  const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('module','exports',code)(evaluatedModule,evaluatedModule.exports);
  return evaluatedModule.exports;
}
const {getTextoSena,getPalabraCompletar,getVariantesSena,getGrupoSena,getSeniasSinAmbiguedad}=load('src/diccionario/textos.ts');
const alphabet=load('src/diccionario/abecedario.ts');
let count=0;
for(const group of catalog) {
  const files=fs.readdirSync(path.join(root,'public',group.carpeta));
  const hashes=new Set();
  for(const [key,file]of Object.entries(group.videos)) {
    assert(files.includes(file),`Exact file path missing: ${group.carpeta}/${file}`);
    assert.equal(key,file.slice(0,-4),`Label/file mismatch: ${key}`);
    const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',group.carpeta,file))).digest('hex');
    assert(!hashes.has(hash),`Duplicate clip in ${group.id}: ${key}`);
    hashes.add(hash);
    assert(!/-a(s)?\b/u.test(getTextoSena(key)),`Unexpanded gender abbreviation: ${key}`);
    assert(!/[-/¿?]/u.test(getPalabraCompletar(key)),`Non-word characters in spelling target: ${key}`);
    assert(getVariantesSena(key).length>0);
    count++;
  }
}
assert.equal(count,419);
assert.equal(alphabet.LETRAS.length,27);
for(const letter of alphabet.LETRAS) {
  const file=alphabet.getAbecedarioVideoPath(letter);
  const parts=file.slice(1).split('/');
  assert(fs.readdirSync(path.join(root,'public')).includes(parts[0]),`Folder case mismatch: ${file}`);
  assert(fs.readdirSync(path.join(root,'public',parts[0])).includes(parts[1]),`Letter clip missing: ${file}`);
}
assert.equal(getTextoSena('Encantado-a'),'Encantado / Encantada');
assert.equal(getTextoSena('Gemelos-as'),'Gemelos / Gemelas');
assert.equal(getTextoSena('Director-a'),'Director / Directora');
assert.equal(getTextoSena('Cómo estás'),'¿Cómo estás?');
assert.equal(getPalabraCompletar('Mi - mío-a'),'Mi');
assert.equal(getPalabraCompletar('Alumno-a - estudiante'),'Alumno');
assert.equal(getGrupoSena('Boda'),getGrupoSena('Casamiento'));
assert.deepEqual(getSeniasSinAmbiguedad(['Boda','Casamiento','Familia']),['Boda','Familia']);
console.log(`OK: ${count} señas y 27 letras con rutas exactas, etiquetas asociadas, sin videos duplicados por categoría y términos legibles para los juegos.`);
