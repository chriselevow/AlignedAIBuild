"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
	vscDarkPlus,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { CopyButton } from "@/components/CopyButton";
import { ReloadButton } from "@/components/ReloadButton";
import { ShareButton } from "@/components/share-button";
import { type HistoryEntry, useStudio } from "@/providers/studio-provider";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { VersionSwitcher } from "./version-switcher";
import { NewButton } from "./new-button";
import { PromptInput } from "./prompt-input";
import { OptionsButton } from "./options-button";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const GRADIENTS = [
	"linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
	"linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fda085 100%)",
	"linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%)",
	"linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
	"linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
	"linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)",
	"linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 50%, #a1c4fd 100%)",
	"linear-gradient(135deg, #fd7043 0%, #ff8a65 25%, #ffb74d 50%, #fff176 100%)",
	"linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #e94560 100%)",
	"linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
	"linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
	"linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)",
];

export default function StudioView() {
	return (
		<Suspense>
			<HomeContent />
		</Suspense>
	);
}

function HomeContent() {
	const searchParams = useSearchParams();
	const {
		history,
		historyIndex,
		navigateHistory,
		currentHtml,
		isOverlayOpen,
		setIsOverlayOpen,
		getFormattedOutput,
		iframeRef,
		setHistory,
		setHistoryIndex,
		setCurrentHtml,
		setMode,
		sessionId,
		setStudioMode,
		isApplying,
		isGenerating,
		isStreaming,
		streamingContent,
		streamingComplete,
		resetStreamingState,
	} = useStudio();
	const { resolvedTheme } = useTheme();
	const sourceLoadedRef = useRef(false);

	const [gradient] = useState(
		() => GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
	);

	useEffect(() => {
		const source = searchParams.get("source");
		if (source && !sourceLoadedRef.current) {
			sourceLoadedRef.current = true;
			const loadSourceVersion = async () => {
				resetStreamingState();
				
				try {
					const response = await fetch(`/api/apps/${source}`);
					if (!response.ok) {
						throw new Error("Failed to load source version");
					}

					let html = "";
					let signature = "";
					const content = await response.text();
					if (content.startsWith("{")) {
						const json = JSON.parse(content);
						html = json.html;
						signature = json.signature;
					} else {
						html = content;
						throw new Error("This pre-release version is not supported");
					}
					const newEntry: HistoryEntry = {
						html,
						feedback: "",
						sessionId,
						version: "1",
						signature,
					};
					setHistory([newEntry]);
					setHistoryIndex(0);
					setCurrentHtml(html);
					setMode("feedback");
					setStudioMode(true);
				} catch (error) {
					console.error("Error loading source version:", error);
					toast.error("Failed to load source version");
					sourceLoadedRef.current = false;
				}
			};
			loadSourceVersion();
		}
	}, [
		searchParams,
		sessionId,
		setCurrentHtml,
		setHistory,
		setHistoryIndex,
		setMode,
		setStudioMode,
		resetStreamingState,
		isStreaming,
		streamingContent,
		streamingComplete,
	]);

	// ─── Streaming phase: full-screen black, code centered ───────────────────
	if (isStreaming) {
		return (
			<main className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
				<div className="w-full max-w-3xl px-8 max-h-[90vh] overflow-auto">
					<div className="flex items-center mb-6">
						<div className="h-2 w-2 rounded-full bg-white mr-3 animate-pulse" />
						<span className="text-xs text-gray-400 font-mono">
							Generating your app...
						</span>
					</div>
					<pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
						{streamingContent || "Thinking..."}
					</pre>
				</div>
			</main>
		);
	}

	// ─── Ready phase: split view ──────────────────────────────────────────────
	return (
		<main className="h-screen flex overflow-hidden">
			{/* Left Column - Code View + Controls (desktop only) */}
			<div className="w-1/2 border-r hidden lg:flex flex-col" style={{ backgroundColor: "#000", color: "#fff" }}>
				{/* Code panel */}
				<div className="relative flex-1 overflow-auto p-4">
					<div
						className={cn(
							"absolute top-0 left-0 h-[2px] bg-white animate-loader",
							isGenerating || isApplying ? "opacity-100" : "opacity-0",
						)}
					/>

					<SyntaxHighlighter
						language="html"
						style={vscDarkPlus}
						className="h-full rounded"
						customStyle={{ margin: 0, height: "100%", width: "100%", background: "#000" }}
					>
						{currentHtml || "<!-- HTML preview will appear here -->"}
					</SyntaxHighlighter>

					<div className="absolute bottom-4 left-4">
						<CopyButton code={currentHtml} />
					</div>
				</div>

				{/* Usage stats */}
				<div className="px-4 py-1 border-t border-gray-800">
					<div className="text-xs text-gray-500 text-center">
						{history[historyIndex]?.usage && (
							<span>
								{(history[historyIndex].usage.total_time * 1000).toFixed(0)}ms •{" "}
								{Math.round(
									history[historyIndex].usage.total_tokens /
										history[historyIndex].usage.total_time,
								)}{" "}
								tokens/sec
							</span>
						)}
					</div>
				</div>

				{/* Input bar */}
				<div className="p-3 border-t border-gray-800 bg-black flex-shrink-0">
					<div className="flex items-center gap-2 mb-2">
						<NewButton />
						<VersionSwitcher
							className="flex-1 justify-center"
							currentVersion={historyIndex + 1}
							totalVersions={history.length}
							onPrevious={() => navigateHistory("prev")}
							onNext={() => navigateHistory("next")}
						/>
						<OptionsButton />
					</div>
					<PromptInput />
				</div>
			</div>

			{/* Right Column - Preview with gradient */}
			<div
				className="lg:w-1/2 w-full flex flex-col overflow-hidden"
				style={{ background: gradient }}
			>
				{/* Preview */}
				<div className="flex-1 relative overflow-hidden p-4">
					<div className="absolute top-2 right-6 flex gap-2 z-10">
						<ReloadButton iframeRef={iframeRef} />
						<ShareButton
							sessionId={history[historyIndex]?.sessionId}
							version={history[historyIndex]?.version}
							signature={history[historyIndex]?.signature}
							disabled={
								!history[historyIndex]?.sessionId ||
								!history[historyIndex]?.version
							}
						/>
					</div>
					<iframe
						title="Studio Preview"
						ref={iframeRef}
						srcDoc={`<style>body{background-color:${resolvedTheme === "dark" ? "rgb(30 30 30)" : "#ffffff"};margin:0;}</style>${currentHtml}`}
						className="w-full h-full border rounded bg-background shadow-sm"
						style={{ minHeight: "100%", minWidth: "100%", overflow: "auto" }}
					/>
				</div>

				{/* Mobile input bar */}
				<div className="lg:hidden p-3 border-t bg-background flex-shrink-0">
					<div className="flex items-center gap-2 mb-2">
						<NewButton />
						<VersionSwitcher
							className="flex-1 justify-center"
							currentVersion={historyIndex + 1}
							totalVersions={history.length}
							onPrevious={() => navigateHistory("prev")}
							onNext={() => navigateHistory("next")}
						/>
						<OptionsButton />
					</div>
					<PromptInput />
				</div>
			</div>

			{/* Sliding Debug Overlay */}
			<div
				className={`fixed top-0 right-0 h-screen w-[60vw] bg-background shadow-lg transform transition-transform duration-300 overflow-hidden z-50 ${isOverlayOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				<div className="h-full flex flex-col p-4">
					<div className="flex justify-between items-center mb-4 flex-shrink-0">
						<h2 className="font-medium">Prompt</h2>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsOverlayOpen(false)}
							className="text-gray-500 hover:text-gray-700"
						>
							<X size={16} />
						</Button>
					</div>
					<pre className="flex-1 text-sm bg-background p-4 rounded overflow-auto">
						{getFormattedOutput()}
					</pre>
				</div>
			</div>
		</main>
	);
}
