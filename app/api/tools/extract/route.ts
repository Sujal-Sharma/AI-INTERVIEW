import { NextRequest } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File | null;

        if (!file) {
            return Response.json({ success: false, error: "Resume is required" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return Response.json({ success: false, error: "Only PDF files are supported" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use pdf-parse/lib/pdf-parse.js directly to avoid the test-file read
        // that happens when importing from the package root in serverless environments
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse/lib/pdf-parse.js");
        const data = await pdfParse(buffer);
        const resumeText = data.text?.trim() ?? "";

        if (!resumeText || resumeText.length < 50) {
            return Response.json(
                { success: false, error: "Could not extract text from PDF. Make sure it is not a scanned image." },
                { status: 400 }
            );
        }

        return Response.json({ success: true, text: resumeText.slice(0, 3000) }, { status: 200 });
    } catch (error: unknown) {
        console.error("PDF extract error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
