import  { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma";



const tests = await prisma.test.findMany({
});

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: tests });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const test = await prisma.test.create({
    data: {
      test: body.test
    }
  });
  return NextResponse.json({ message: body }, { status: 201 });
}