import { Button } from "@/components/ui/button";
import { useStudio } from "@/providers/studio-provider";
import { useRef, useState, useEffect, useCallback } from "react";
import { APP_EXAMPLES } from "@/data/app-examples";
import { Info, Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import toast from "react-hot-toast";
import { MAINTENANCE_GENERATION } from "@/lib/settings";

const COOL_APP_SUGGESTIONS = [
	"Snake Game",
	"Kanban Board",
	"Chatbot",
	"Weather App",
	"Expense Tracker",
];

type Step = "input" | "wireframe";

export default function PromptView() {
	const {
		setStudioMode,
		query,
		setQuery,
		setTriggerGeneration,
		setDrawingData,
		resetStreamingState,
	} = useStudio();

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

	const [step, setStep] = useState<Step>("input");
	const [wireframeHtml, setWireframeHtml] = useState("");
	const [isDescribing, setIsDescribing] = useState(false);
	const [isGeneratingWireframe, setIsGeneratingWireframe] = useState(false);

	// Snapshot of drawing captured when user moves to wireframe step
	const drawingSnapshotRef = useRef<string | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctxRef.current = ctx;
	}, []);

	const getPos = (
		e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
	) => {
		const canvas = canvasRef.current;
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		if ("touches" in e) {
			return {
				x: (e.touches[0].clientX - rect.left) * scaleX,
				y: (e.touches[0].clientY - rect.top) * scaleY,
			};
		}
		return {
			x: e.nativeEvent.offsetX * scaleX,
			y: e.nativeEvent.offsetY * scaleY,
		};
	};

	const startDrawing = (
		e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
	) => {
		const ctx = ctxRef.current;
		if (!ctx) return;
		setIsDrawing(true);
		const { x, y } = getPos(e);
		ctx.beginPath();
		ctx.moveTo(x, y);
	};

	const draw = (
		e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
	) => {
		if (!isDrawing || !ctxRef.current) return;
		e.preventDefault();
		const { x, y } = getPos(e);
		ctxRef.current.lineTo(x, y);
		ctxRef.current.stroke();
	};

	const stopDrawing = () => {
		ctxRef.current?.closePath();
		setIsDrawing(false);
	};

	const clearCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		const ctx = ctxRef.current;
		if (!canvas || !ctx) return;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}, []);

	const getDrawingData = useCallback((): string | null => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
				return canvas.toDataURL("image/jpeg");
			}
		}
		return null;
	}, []);

	// Use Groq vision to describe the drawing and fill the text input
	const handleDescribeDrawing = async () => {
		const drawing = getDrawingData();
		if (!drawing) {
			toast.error("Draw something on the canvas first!");
			return;
		}
		setIsDescribing(true);
		try {
			const res = await fetch("/api/describe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imageData: drawing }),
			});
			if (!res.ok) throw new Error("Failed to describe drawing");
			const { description } = await res.json();
			if (description) setQuery(description);
		} catch {
			toast.error("Could not describe drawing. Try again.");
		} finally {
			setIsDescribing(false);
		}
	};

	// Generate wireframe and move to wireframe step
	const handlePreviewWireframe = async () => {
		const drawing = getDrawingData();
		if (!query.trim() && !drawing) {
			toast.error("Describe your app or draw it!");
			return;
		}
		drawingSnapshotRef.current = drawing;
		setIsGeneratingWireframe(true);
		try {
			const res = await fetch("/api/wireframe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query, drawingData: drawing }),
			});
			if (!res.ok) throw new Error("Failed to generate wireframe");
			const { html } = await res.json();
			setWireframeHtml(html || "");
			setStep("wireframe");
		} catch {
			toast.error("Could not generate wireframe. Try again.");
		} finally {
			setIsGeneratingWireframe(false);
		}
	};

	// Confirm wireframe and trigger the actual build
	const handleConfirmBuild = () => {
		setDrawingData(drawingSnapshotRef.current);
		resetStreamingState();
		setStudioMode(true);
		setTriggerGeneration(true);
	};

	const handleSuggestionClick = (label: string) => () => {
		const example = APP_EXAMPLES.find((ex) => ex.label === label);
		setQuery(example?.prompt || label);
		setDrawingData(null);
		resetStreamingState();
		setStudioMode(true);
		setTriggerGeneration(true);
	};

	// ── Wireframe step ──────────────────────────────────────────────────────────
	if (step === "wireframe") {
		return (
			<div className="fixed inset-0 bg-black flex flex-col">
				{/* Top bar */}
				<div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
					<button
						type="button"
						onClick={() => setStep("input")}
						className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back
					</button>
					<span className="text-sm text-white/40 font-mono">Wireframe Preview</span>
					<Button
						type="button"
						onClick={handleConfirmBuild}
						className="flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold bg-white text-black hover:bg-gray-100"
					>
						<Check className="h-4 w-4" />
						Confirm &amp; Build
					</Button>
				</div>

				{/* Wireframe iframe */}
				<div className="flex-1 overflow-hidden">
					<iframe
						title="Wireframe Preview"
						srcDoc={wireframeHtml}
						className="w-full h-full border-0"
						style={{ background: "#000" }}
					/>
				</div>
			</div>
		);
	}

	// ── Input step ──────────────────────────────────────────────────────────────
	return (
		<div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 overflow-auto">
			{MAINTENANCE_GENERATION && (
				<div className="mb-4 text-center text-white flex items-center gap-2 border border-white/30 rounded-full px-4 py-2 bg-white/10 text-sm">
					<Info className="h-4 w-4 shrink-0" />
					<span>{"We're currently undergoing maintenance. We'll be back soon!"}</span>
				</div>
			)}

			<div className="w-full max-w-lg flex flex-col gap-4">
				{/* Square drawing canvas */}
				<div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white relative">
					<canvas
						ref={canvasRef}
						width={500}
						height={500}
						className="block cursor-crosshair touch-none w-full h-full"
						onMouseDown={startDrawing}
						onMouseMove={draw}
						onMouseUp={stopDrawing}
						onMouseLeave={stopDrawing}
						onTouchStart={startDrawing}
						onTouchMove={draw}
						onTouchEnd={stopDrawing}
					/>
					{/* Canvas toolbar */}
					<div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-3 py-2 border-t border-gray-100 bg-white/90 backdrop-blur-sm">
						<button
							type="button"
							onClick={clearCanvas}
							className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
						>
							Clear
						</button>
						<button
							type="button"
							onClick={handleDescribeDrawing}
							disabled={isDescribing || MAINTENANCE_GENERATION}
							className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 transition-colors"
						>
							<Sparkles className="h-3.5 w-3.5" />
							{isDescribing ? "Describing…" : "Describe with AI"}
						</button>
					</div>
				</div>

				{/* AI-style text input */}
				<div className="w-full rounded-2xl border border-white/15 bg-[#111] overflow-hidden shadow-2xl">
					<textarea
						disabled={MAINTENANCE_GENERATION}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="w-full bg-transparent text-sm text-gray-100 placeholder-white/25 focus:outline-none resize-none px-5 pt-4 pb-2 leading-relaxed min-h-[96px]"
						placeholder={"Describe your app idea…\n\nWhat should it do? What should it look like?"}
						onKeyDown={(e) => {
							if (e.key === "Enter" && e.metaKey) {
								e.preventDefault();
								handlePreviewWireframe();
							}
						}}
					/>
					<div className="flex items-center justify-between px-4 py-2 border-t border-white/8">
						<span className="text-[11px] text-white/25">⌘↩ to preview</span>
					</div>
				</div>

				{/* Suggestion chips */}
				<div className="flex flex-wrap justify-center gap-2">
					{COOL_APP_SUGGESTIONS.map((label) => (
						<button
							key={label}
							type="button"
							disabled={MAINTENANCE_GENERATION}
							onClick={handleSuggestionClick(label)}
							className="rounded-full text-xs px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors whitespace-nowrap"
						>
							{label}
						</button>
					))}
				</div>

				{/* Preview wireframe button */}
				<Button
					type="button"
					disabled={MAINTENANCE_GENERATION || isGeneratingWireframe}
					onClick={handlePreviewWireframe}
					className="w-full rounded-full py-3 text-sm font-semibold bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2 disabled:opacity-60"
				>
					{isGeneratingWireframe ? (
						<>
							<span className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
							Generating Wireframe…
						</>
					) : (
						<>
							Preview Wireframe
							<ArrowRight className="h-4 w-4" />
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
