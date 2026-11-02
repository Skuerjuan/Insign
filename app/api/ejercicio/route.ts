import { NextRequest, NextResponse } from 'next/server'
import getEjercicio from '@/lib/server/ejercicios.actions';

export async function GET(request: NextRequest) {
    const tipo = request.nextUrl.searchParams.get("tipo") ?? "";
    const nivel = Number(request.nextUrl.searchParams.get("nivel"));
    const data = await getEjercicio(tipo, nivel);

    return NextResponse.json({ data });
}
