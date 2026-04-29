import crypto from "node:crypto";

let fallbackSecretKey: string | undefined;

function getSecretKey(): string {
	const secretKey = process.env.HTML_SIGNING_SECRET;
	if (secretKey) {
		return secretKey;
	}
	if (!fallbackSecretKey) {
		console.warn(
			"HTML_SIGNING_SECRET not found in environment variables. " +
			"Using a randomly generated key — signatures will not persist across server restarts. " +
			"Set HTML_SIGNING_SECRET for production use.",
		);
		fallbackSecretKey = crypto.randomBytes(32).toString("hex");
	}
	return fallbackSecretKey;
}

/**
 * Sign the given HTML using an HMAC with SHA-256.
 * @param html The HTML string to sign.
 * @returns A hex-encoded signature string.
 */
export function signHtml(html: string): string {
	const hmac = crypto.createHmac("sha256", getSecretKey());
	hmac.update(html, "utf8");
	return hmac.digest("hex");
}

/**
 * Verify the given HTML against a provided signature.
 * @param html The HTML string to verify.
 * @param signature The signature received along with the HTML.
 * @returns true if the signature matches, false otherwise.
 */
export function verifyHtml(html: string, signature: string): boolean {
	if (!html || !signature) {
		return false;
	}
	try {
		const expectedSignature = signHtml(html);
		return crypto.timingSafeEqual(
			Buffer.from(signature, "hex"),
			Buffer.from(expectedSignature, "hex"),
		);
	} catch (error) {
		console.error("Error verifying HTML:", error);
		return false;
	}
}
