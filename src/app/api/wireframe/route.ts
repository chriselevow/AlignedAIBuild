import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
	PRIMARY_VISION_MODEL,
	FALLBACK_VISION_MODEL,
	getFallbackModel,
} from "@/utils/models";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const WIREFRAME_MODEL = "llama-3.3-70b-versatile";

const WIREFRAME_PROMPT_PREFIX = `You are a wireframe HTML generator. Generate a minimal HTML wireframe that visually represents the described app layout.

Rules — follow without exception:
- <body>: background #000; color #fff; font-family: sans-serif; margin: 0; padding: 1.5rem;
- Layout containers: border: 1px solid rgba(255,255,255,0.5); padding: 1rem; margin-bottom: 0.75rem; border-radius: 4px;
- Buttons: border: 1px solid #fff; background: transparent; color: #fff; padding: 0.5rem 1.25rem; cursor: pointer; border-radius: 4px;
- Text inputs / textareas: border: 1px solid rgba(255,255,255,0.4); background: transparent; color: #fff; padding: 0.5rem; width: 100%; box-sizing: border-box;
- Image placeholders: empty div with border: 1px solid rgba(255,255,255,0.3); min-height: 120px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.4); font-size: 0.75rem; containing only the text "[ image ]"
- NO Tailwind, NO external CSS libraries, NO colors other than black / white / rgba-white
- Use a single <style> block in <head> for shared rules; override with inline style only when necessary
- Label every major section with a small annotation (e.g. "Navigation", "Hero Section", "Product Grid") in a muted rgba(255,255,255,0.35) color at 0.7rem

Return ONLY the complete HTML file wrapped in triple backticks with the html specifier.`;

export async function POST(request: Request) {
	try {
		const { query, drawingData } = await request.json();

		let finalQuery = query || "";

		// If a drawing is provided, use vision to get a one-sentence description
		if (drawingData) {
			try {
				const visionCompletion = await client.chat.completions.create({
					messages: [
						{
							role: "user",
							content: [
								{
									type: "text",
									text: "Describe this UI sketch in one sentence — what kind of app is it and what are the main elements?",
								},
								{
									type: "image_url",
									image_url: { url: drawingData },
								},
							],
						},
					],
					model: PRIMARY_VISION_MODEL,
					temperature: 0.2,
					max_tokens: 128,
					top_p: 1,
					stream: false,
					stop: null,
				});
				const drawingDesc =
					visionCompletion.choices[0].message.content ?? "";
				finalQuery = finalQuery
					? `${finalQuery}\nSketch: ${drawingDesc}`
					: drawingDesc;
			} catch (primaryErr) {
				console.error("Primary vision model failed for wireframe sketch, trying fallback:", primaryErr);
				try {
					const fallbackCompletion = await client.chat.completions.create({
						messages: [
							{
								role: "user",
								content: [
									{
										type: "text",
										text: "Describe this UI sketch in one sentence — what kind of app is it and what are the main elements?",
									},
									{
										type: "image_url",
										image_url: { url: drawingData },
									},
								],
							},
						],
						model: FALLBACK_VISION_MODEL,
						temperature: 0.2,
						max_tokens: 128,
						top_p: 1,
						stream: false,
						stop: null,
					});
					const drawingDesc =
						fallbackCompletion.choices[0].message.content ?? "";
					finalQuery = finalQuery
						? `${finalQuery}\nSketch: ${drawingDesc}`
						: drawingDesc;
				} catch (fallbackErr) {
					// Both vision models failed — proceed with text-only description
					console.error("Fallback vision model also failed for wireframe sketch:", fallbackErr);
				}
			}
		}

		const userPrompt = `${WIREFRAME_PROMPT_PREFIX}\n\nGenerate a wireframe for: ${finalQuery || "a simple web app"}`;

		let rawHtml = "";
		try {
			const completion = await client.chat.completions.create({
				messages: [{ role: "user", content: userPrompt }],
				model: WIREFRAME_MODEL,
				temperature: 0.2,
				max_tokens: 4096,
				stream: false,
				stop: null,
			});
			rawHtml = completion.choices[0].message.content ?? "";
		} catch (primaryErr) {
			console.error("Primary model failed for wireframe generation, trying fallback:", primaryErr);
			const completion = await client.chat.completions.create({
				messages: [{ role: "user", content: userPrompt }],
				model: getFallbackModel(),
				temperature: 0.2,
				max_tokens: 4096,
				stream: false,
				stop: null,
			});
			rawHtml = completion.choices[0].message.content ?? "";
		}

		// Extract HTML from code fences if present
		let html = rawHtml;
		if (html.includes("```html")) {
			const match = html.match(/```html\n([\s\S]*?)\n```/);
			html = match ? match[1] : html;
		} else if (html.includes("```")) {
			const match = html.match(/```\n([\s\S]*?)\n```/);
			html = match ? match[1] : html;
		}

		return NextResponse.json({ html });
	} catch (error) {
		console.error("Error generating wireframe:", error);
		return NextResponse.json(
			{ error: "Failed to generate wireframe" },
			{ status: 500 },
		);
	}
}
