import { NextRequest } from "next/server";
import { extractText } from "unpdf";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File | null;

        if (!file) {
            return Response.json({ success: false, error: "Resume is required" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const { text: pages } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
        const resumeText = Array.isArray(pages) ? pages.join(" ").trim() : String(pages).trim();

        if (!resumeText || resumeText.length < 50) {
            return Response.json({ success: false, error: "Could not extract text from PDF. Make sure it is not a scanned image." }, { status: 400 });
        }

        return Response.json({ success: true, text: resumeText.slice(0, 3000) }, { status: 200 });
    } catch (error: unknown) {
        console.error("PDF extract error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
