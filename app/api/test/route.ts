import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "ok" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ message: body }, { status: 201 });
}
