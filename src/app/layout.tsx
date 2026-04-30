import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ROOT_URL } from "@/utils/config";
import { MAINTENANCE_MODE } from "@/lib/settings";
import { LayoutClientContent } from '@/components/layout-client-content';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Aligned AI Web Builder",
	description: "Interactive HTML editor with AI generation",

	icons: {
		icon: "https://joinaligned.ai/favicon.ico",
	},

	openGraph: {
		type: "website",
		url: ROOT_URL,
		title: "Aligned AI Web Builder",
		description: "Interactive HTML editor with AI generation",
		images: `${ROOT_URL}/og-labs.png`,
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<LayoutClientContent>
						{MAINTENANCE_MODE ? (
							<div className="text-center text-gray-500 py-8">
								{"We're currently undergoing maintenance. We'll be back soon!"}
							</div>
						) : (
							<>
								{children}
								<Toaster position="bottom-right" />
							</>
						)}
					</LayoutClientContent>

				</ThemeProvider>
			</body>
		</html>
	);
}
