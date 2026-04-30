import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PRIMARY_VISION_MODEL, FALLBACK_VISION_MODEL } from "@/utils/models";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
	try {
		const { imageData } = await request.json();

		if (!imageData) {
			return NextResponse.json(
				{ error: "No image data provided" },
				{ status: 400 },
			);
		}

		const messageContent = [
			{
				type: "text" as const,
				text: "Describe this UI sketch or wireframe drawing in a single paragraph. Focus on: what kind of app it is, the main UI components visible, the layout structure, and key features. Be concise but specific.",
			},
			{
				type: "image_url" as const,
				image_url: { url: imageData },
			},
		];

		let description = "";
		try {
			const completion = await client.chat.completions.create({
				messages: [{ role: "user", content: messageContent }],
				model: PRIMARY_VISION_MODEL,
				temperature: 0.3,
				max_tokens: 256,
				top_p: 1,
				stream: false,
				stop: null,
			});
			description = completion.choices[0].message.content ?? "";
		} catch {
			const completion = await client.chat.completions.create({
				messages: [{ role: "user", content: messageContent }],
				model: FALLBACK_VISION_MODEL,
				temperature: 0.3,
				max_tokens: 256,
				top_p: 1,
				stream: false,
				stop: null,
			});
			description = completion.choices[0].message.content ?? "";
		}

		return NextResponse.json({ description });
	} catch (error) {
		console.error("Error describing drawing:", error);
		return NextResponse.json(
			{ error: "Failed to describe drawing" },
			{ status: 500 },
		);
	}
}
