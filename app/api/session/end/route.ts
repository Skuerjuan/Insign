import { NextResponse } from "next/server";
import { recordSessionEnd } from "@/lib/server/profile.actions";

export async function POST() {
    try {
        await recordSessionEnd();
        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "An error occurred";
        return NextResponse.json({ success: false, message }, { status: 401 });
    }
}
