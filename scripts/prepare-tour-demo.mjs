// Isolated recording fixture. It copies the real UI and uses synthetic data.
// No production authentication, environment files or database are accessed.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Keep the copied TypeScript outside the app so production checks do not scan it.
const demo = path.resolve(root, '../.insign-tour-demo');
fs.mkdirSync(demo, {recursive:true});
for (const dir of ['app','components','src','lib']) {
  fs.cpSync(path.join(root,dir),path.join(demo,dir),{
    recursive:true,
    filter: source => !source.startsWith(path.join(root,'app/api')),
  });
}
for (const name of ['package.json','tsconfig.json','postcss.config.mjs']) {
  fs.copyFileSync(path.join(root,name),path.join(demo,name));
}
for (const name of ['public','node_modules']) {
  const dest=path.join(demo,name);
  if (!fs.existsSync(dest)) fs.symlinkSync(path.join(root,name),dest,'junction');
}
const write=(name,text)=>fs.writeFileSync(path.join(demo,name),text);
write('next.config.mjs',`export default {devIndicators:false,typescript:{ignoreBuildErrors:true},images:{unoptimized:true},outputFileTracingRoot:${JSON.stringify(root)}};\n`);
write('lib/auth/server.ts',`const user={id:'tour-demo',name:'Aprendiz de LSA',email:'demo@example.invalid',image:'/loro-saludando.png'};
const ok=async()=>({data:{url:'/menu'},error:null});
export const auth={getSession:async()=>({data:{user,session:{id:'tour-demo'}}}),signIn:{email:ok,social:ok},signUp:{email:ok},emailOtp:{verifyEmail:ok,sendVerificationOtp:ok}};
`);
write('lib/auth/client.ts',`'use client';
const ok=async()=>({data:{},error:null});
export const authClient={useSession:()=>({data:null,isPending:false}),updateUser:ok,signOut:ok,changePassword:ok,requestPasswordReset:ok,resetPassword:ok,signIn:{social:ok,email:ok},signUp:{email:ok}};
`);
write('lib/server/profile.actions.ts',`'use server';
import {getLocalDayNumber} from './streak';
export type GameName='eleccion'|'memoria'|'adivinar'|'completar';
export type GameOrigin='menu'|'training'|'exam';
export async function getSession(){return {id:'tour-demo',name:'Aprendiz de LSA',email:'demo@example.invalid',image:'/loro-saludando.png'};}
export async function getProfile(){return {user_id:'tour-demo',puntos:1250,experiencia:1250,nivel:3,premios:4,racha:7,ultimo_dia_activo:getLocalDayNumber(),juegos_jugados:12,tiempo_total_segundos:1800,dias_activos:3,senas_aprendidas:[]};}
export async function getCompletedGames(){return ['memoria'];}
export async function getLearnedSignsCount(){return 28;}
export async function recordLearnedSign(){return true;}
export async function getLogros(){return [];}
export async function getAchievementProgress(){return {learnedSigns:28,totalSigns:419,completedTopics:2,achievements:[
{id:'primeras-senas',name:'Primeras señas',description:'Completá tu primera partida.',unlocked:true},
{id:'manos-a-la-obra',name:'Manos a la obra',description:'Practicá en Entrenamiento.',unlocked:true},
{id:'aprendiz',name:'Aprendiz',description:'Aprendé diez señas.',unlocked:true},
{id:'maestro-de-senas',name:'Maestro de señas',description:'Aprendé cincuenta señas.',unlocked:false}
]};}
export async function completeGame(){return {pointsAwarded:15,starsAwarded:3,levelUp:false};}
export async function recordSessionEnd(){return {ok:true};}
`);
// Use the same bundled fonts without requesting fonts from a remote service.
write('app/layout.tsx',`import type {Metadata} from 'next';
import ThemeInitializer from '@/components/ThemeInitializer';
import '@fontsource/baloo-2/400.css';import '@fontsource/baloo-2/500.css';import '@fontsource/baloo-2/600.css';import '@fontsource/baloo-2/700.css';import '@fontsource/baloo-2/800.css';
import '@fontsource/rubik/900.css';import '@fontsource/geist/400.css';import '@fontsource/geist-mono/400.css';
import './globals.css';
export const metadata:Metadata={title:'InSign',description:'Recorrido de demostración de InSign con Waki'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang='es' suppressHydrationWarning style={{'--font-baloo':'"Baloo 2"','--font-rubik':'Rubik','--font-rubik-one':'Rubik','--font-geist-sans':'Geist','--font-geist-mono':'"Geist Mono"',fontFamily:'"Baloo 2"'} as React.CSSProperties}><body className='min-h-full flex flex-col' suppressHydrationWarning><ThemeInitializer/>{children}</body></html>}
`);
fs.mkdirSync(path.join(demo,'app/api/session/end'),{recursive:true});
write('app/api/session/end/route.ts',`export async function POST(){return Response.json({ok:true});}`);
write('TOUR-DEMO.txt','Isolated UI recording fixture. Synthetic data only. Do not deploy.');
console.log(demo);
