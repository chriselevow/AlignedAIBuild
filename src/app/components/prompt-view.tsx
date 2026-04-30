import { Button } from "@/components/ui/button";
import { useStudio } from "@/providers/studio-provider";
import { useRef, useState, useEffect, useCallback } from "react";
import { APP_EXAMPLES } from "@/data/app-examples";
import { Info } from "lucide-react";
import toast from "react-hot-toast";
import { MAINTENANCE_GENERATION } from "@/lib/settings";

const COOL_APP_SUGGESTIONS = [
	"Snake Game",
	"Kanban Board",
	"Chatbot",
	"Weather App",
	"Expense Tracker",
];

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

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const drawing = getDrawingData();
		if (!query.trim() && !drawing) {
			toast.error("Describe your app or draw it!");
			return;
		}
		setDrawingData(drawing);
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

	return (
		<div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 overflow-auto">
			{MAINTENANCE_GENERATION && (
				<div className="mb-4 text-center text-white flex items-center gap-2 border border-white/30 rounded-full px-4 py-2 bg-white/10 text-sm">
					<Info className="h-4 w-4 shrink-0" />
					<span>{"We're currently undergoing maintenance. We'll be back soon!"}</span>
				</div>
			)}

			<form
				className="w-full max-w-3xl flex flex-col gap-4"
				onSubmit={handleSubmit}
			>
				{/* Two-column panel */}
				<div className="flex flex-col md:flex-row gap-4 h-[360px]">
					{/* Left — Drawing canvas */}
					<div className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white min-w-0">
						<canvas
							ref={canvasRef}
							width={500}
							height={400}
							className="flex-1 block cursor-crosshair touch-none w-full"
							onMouseDown={startDrawing}
							onMouseMove={draw}
							onMouseUp={stopDrawing}
							onMouseLeave={stopDrawing}
							onTouchStart={startDrawing}
							onTouchMove={draw}
							onTouchEnd={stopDrawing}
						/>
						<div className="flex justify-between items-center px-3 py-2 border-t border-gray-100 bg-white shrink-0">
							<span className="text-xs text-gray-400">Draw your idea</span>
							<button
								type="button"
								onClick={clearCanvas}
								className="text-xs text-gray-400 hover:text-gray-600"
							>
								Clear
							</button>
						</div>
					</div>

					{/* Right — Notes / chat input */}
					<div className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-[#111] border border-white/10 min-w-0">
						<div className="px-4 pt-3 pb-1 shrink-0">
							<span className="text-xs text-gray-500">Notes</span>
						</div>
						<textarea
							disabled={MAINTENANCE_GENERATION}
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="flex-1 w-full bg-transparent text-sm text-gray-100 placeholder-gray-600 focus:outline-none resize-none px-4 pb-4 leading-relaxed"
							placeholder={"Describe your app...\n\nWhat should it do?\nWhat should it look like?"}
							onKeyDown={(e) => {
								if (e.key === "Enter" && e.metaKey) {
									e.preventDefault();
									e.currentTarget.form?.requestSubmit();
								}
							}}
						/>
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

				{/* Build button */}
				<Button
					type="submit"
					disabled={MAINTENANCE_GENERATION}
					className="w-full rounded-full py-3 text-sm font-semibold bg-white text-black hover:bg-gray-100"
				>
					Build
				</Button>
			</form>
		</div>
	);
}
