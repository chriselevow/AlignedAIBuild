"use client";

import { Suspense, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
	vscDarkPlus,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { CopyButton } from "@/components/CopyButton";
import { ReloadButton } from "@/components/ReloadButton";
import { ShareButton } from "@/components/share-button";
import { type HistoryEntry, useStudio } from "@/providers/studio-provider";
import { Button } from "@/components/ui/button";
import { X, Save } from "lucide-react";
import { VersionSwitcher } from "./version-switcher";
import { NewButton } from "./new-button";
import { PromptInput } from "./prompt-input";
import { OptionsButton } from "./options-button";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";

export default function StudioView() {
	return (
		<Suspense>
			<HomeContent />
		</Suspense>
	);
}

function HomeContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
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
		setQuery,
		setCurrentFeedback,
		setSessionId,
	} = useStudio();
	const sourceLoadedRef = useRef(false);

	const handleSave = () => {
		if (!currentHtml) return;
		const blob = new Blob([currentHtml], { type: "text/html" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "app.html";
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Saved!");
	};

	const handleExitEditor = () => {
		setStudioMode(false);
		setQuery("");
		setHistory([]);
		setHistoryIndex(-1);
		setCurrentHtml("");
		setSessionId(uuidv4());
		setMode("query");
		setCurrentFeedback("");
		resetStreamingState();
		router.push("/");
	};

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

	// ─── Streaming phase: full-screen light, code centered ───────────────────
	if (isStreaming) {
		return (
			<main className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden">
				{/* Header */}
				<header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
					<Button
						variant="outline"
						size="sm"
						className="flex items-center gap-2"
						disabled
					>
						<Save size={16} />
						Save
					</Button>
					<div className="flex items-center justify-center">
						<Image src="/icons/icon.png" alt="Logo" width={36} height={36} className="rounded-lg" />
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="text-gray-600 hover:text-gray-900"
						onClick={handleExitEditor}
					>
						Exit Editor
					</Button>
				</header>
				<div className="flex-1 flex items-center justify-center overflow-hidden">
					<div className="w-full max-w-3xl px-8 max-h-[90vh] overflow-auto">
						<div className="flex items-center mb-6">
							<div className="h-2 w-2 rounded-full bg-gray-800 mr-3 animate-pulse" />
							<span className="text-xs text-gray-500 font-mono">
								Generating your app...
							</span>
						</div>
						<pre className="font-mono text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
							{streamingContent || "Thinking..."}
						</pre>
					</div>
				</div>
			</main>
		);
	}

	// ─── Ready phase: split view ──────────────────────────────────────────────
	return (
		<main className="h-screen flex flex-col overflow-hidden bg-gray-50">
			{/* Top Header */}
			<header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
				<Button
					variant="outline"
					size="sm"
					className="flex items-center gap-2"
					onClick={handleSave}
					disabled={!currentHtml}
				>
					<Save size={16} />
					Save
				</Button>
				<div className="flex items-center justify-center">
					<Image src="/icons/icon.png" alt="Logo" width={36} height={36} className="rounded-lg" />
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="text-gray-600 hover:text-gray-900"
					onClick={handleExitEditor}
				>
					Exit Editor
				</Button>
			</header>

			{/* Content area */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left Column - Code View + Controls (desktop only) */}
				<div className="w-1/2 border-r hidden lg:flex flex-col bg-[#1e1e1e]">
					{/* Code panel */}
					<div className="relative flex-1 overflow-auto p-4">
						<div
							className={cn(
								"absolute top-0 left-0 h-[2px] bg-blue-400 animate-loader",
								isGenerating || isApplying ? "opacity-100" : "opacity-0",
							)}
						/>

						<SyntaxHighlighter
							language="html"
							style={vscDarkPlus}
							className="h-full rounded"
							customStyle={{ margin: 0, height: "100%", width: "100%", background: "#1e1e1e" }}
						>
							{currentHtml || "<!-- HTML preview will appear here -->"}
						</SyntaxHighlighter>

						<div className="absolute bottom-4 left-4">
							<CopyButton code={currentHtml} />
						</div>
					</div>

					{/* Usage stats */}
					<div className="px-4 py-1 border-t border-gray-700">
						<div className="text-xs text-gray-400 text-center">
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
					<div className="p-3 border-t border-gray-700 bg-[#1e1e1e] flex-shrink-0">
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

				{/* Right Column - Preview */}
				<div className="lg:w-1/2 w-full flex flex-col overflow-hidden bg-gray-100">
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
							srcDoc={`<style>body{background-color:#ffffff;margin:0;}</style>${currentHtml}`}
							className="w-full h-full border rounded bg-white shadow-sm"
							style={{ minHeight: "100%", minWidth: "100%", overflow: "auto" }}
						/>
					</div>

					{/* Mobile input bar */}
					<div className="lg:hidden p-3 border-t bg-white flex-shrink-0">
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
			</div>

			{/* Sliding Debug Overlay */}
			<div
				className={`fixed top-0 right-0 h-screen w-[60vw] bg-white shadow-lg transform transition-transform duration-300 overflow-hidden z-50 ${isOverlayOpen ? "translate-x-0" : "translate-x-full"}`}
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
					<pre className="flex-1 text-sm bg-gray-50 p-4 rounded overflow-auto">
						{getFormattedOutput()}
					</pre>
				</div>
			</div>
		</main>
	);
}
