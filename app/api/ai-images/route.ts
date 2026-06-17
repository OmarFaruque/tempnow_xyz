import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

interface DecodedToken {
  id: number;
  email: string;
  iat: number;
  exp: number;
}

type IncomingAttachment = {
  filename: string;
  mimeType: string;
  dataUrl: string;
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authorization header missing or invalid" },
      { status: 401 },
    );
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await req.json();
  const prompt = body?.prompt as string;
  const attachments = (body?.attachments || []) as IncomingAttachment[];


  


  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
    return NextResponse.json(
      { error: "Prompt is required and must be at least 3 characters." },
      { status: 400 },
    );
  }

  try {
    const setting = await db
      .select()
      .from(settings)
      .where(eq(settings.param, "openai"))
      .limit(1);

    if (!setting?.length) {
      return NextResponse.json(
        { error: "OpenAI settings not found. Please configure it first." },
        { status: 400 },
      );
    }

    const openaiConfig = JSON.parse(setting[0].value);
    const openaiApiKey = openaiConfig.apiKey;

    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is missing. Please configure it first." },
        { status: 400 },
      );
    }

    const cleanAttachments = attachments
      .slice(0, 4)
      .filter((attachment) => attachment?.dataUrl?.startsWith("data:image/"));

    const openaiEndpoint = cleanAttachments.length
      ? "https://api.openai.com/v1/images/edits"
      : "https://api.openai.com/v1/images/generations";

    const payload = cleanAttachments.length
      ? {
          model: "gpt-image-1",
          prompt,
          images: cleanAttachments.map((attachment) => ({
            image_url: attachment.dataUrl,
          })),
          size: "1024x1024",
          quality: "high",
          output_format: "png",
        }
      : {
          model: "gpt-image-1",
          prompt,
          size: "1024x1024",
          quality: "high",
          output_format: "png",
        };

    console.log("Sending request to OpenAI with payload:", payload);
    console.log("Using OpenAI endpoint:", openaiEndpoint);
    const response = await fetch(openaiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("OpenAI response 2:", data);

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Failed to generate image." },
        { status: response.status },
      );
    }

    const imageBase64 = data?.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "No image returned by AI." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error("AI image generation error:", error);
    return NextResponse.json(
      { error: "Server error while generating image." },
      { status: 500 },
    );
  }
}