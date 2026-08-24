import { NextRequest, NextResponse } from 'next/server'
import getEjercicio from '@/lib/server/ejercicios.actions';

export async function GET(request: NextRequest) {

    const data = await getEjercicio("introduccion", 1, "eleccion");

    return NextResponse.json({ data });
}