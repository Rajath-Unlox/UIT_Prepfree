import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    const dir = path.join(process.cwd(), "public", "images", "Login_Signup_Heros");

    try {
        const files = fs.readdirSync(dir)
            .filter(f => /\.(webp|jpe?g|png|avif|gif)$/i.test(f))
            .sort();

        const images = files.map(f => `/images/Login_Signup_Heros/${encodeURIComponent(f)}`);
        return NextResponse.json({ images });
    } catch {
        return NextResponse.json({ images: [] });
    }
}
