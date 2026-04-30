import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ROOT_URL } from "@/utils/config";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getOgImageUrl(sessionId: string, version: string) {
	return `https://image.thum.io/get/${ROOT_URL}/api/apps/${sessionId}/${version}/raw`;
}

const CARD_GRADIENTS = [
	"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
	"linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
	"linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
	"linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
	"linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
	"linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
	"linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
	"linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
	"linear-gradient(135deg, #fd7043 0%, #ffca28 100%)",
	"linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
	"linear-gradient(135deg, #fc5c7d 0%, #6a3093 100%)",
	"linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
];

/** Returns a stable vivid gradient for a given sessionId. */
export function getCardGradient(sessionId: string): string {
	let hash = 0;
	for (let i = 0; i < sessionId.length; i++) {
		hash = (hash * 31 + sessionId.charCodeAt(i)) >>> 0;
	}
	return CARD_GRADIENTS[hash % CARD_GRADIENTS.length];
}
