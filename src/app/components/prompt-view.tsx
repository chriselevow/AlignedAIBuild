import { Button } from "@/components/ui/button";
import { useStudio } from "@/providers/studio-provider";
import { useRef, useState, useEffect, useCallback } from "react";
import { APP_EXAMPLES } from "@/data/app-examples";
import { Info } from "lucide-react";
import toast from "react-hot-toast";
import { MAINTENANCE_GENERATION } from "@/lib/settings";

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

	const [gradient, setGradient] = useState(GRADIENTS[0]);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

	useEffect(() => {
		setGradient(GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]);
	}, []);

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
		// Check if canvas has any drawing (not blank white)
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;
		let hasDrawing = false;
		for (let i = 0; i < data.length; i += 4) {
			if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
				hasDrawing = true;
				break;
			}
		}
		return hasDrawing ? canvas.toDataURL("image/jpeg") : null;
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
		<div
			className="fixed inset-0 flex flex-col items-center justify-center overflow-auto py-8"
			style={{ background: "#000" }}
		>
			<div className="flex flex-col items-center gap-4 w-full max-w-md px-4">
				{MAINTENANCE_GENERATION && (
					<div className="text-center text-white flex items-center gap-2 border border-white/50 rounded-full px-4 py-3 bg-black/20">
						<Info className="h-4 w-4 shrink-0" />
						<span className="text-sm">{"We're currently undergoing maintenance. We'll be back soon!"}</span>
					</div>
				)}

				{/* Drawing board */}
				<div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
					<canvas
						ref={canvasRef}
						width={360}
						height={260}
						className="block cursor-crosshair touch-none w-full"
						onMouseDown={startDrawing}
						onMouseMove={draw}
						onMouseUp={stopDrawing}
						onMouseLeave={stopDrawing}
						onTouchStart={startDrawing}
						onTouchMove={draw}
						onTouchEnd={stopDrawing}
					/>
					<div className="flex justify-end px-3 py-2 border-t border-gray-100">
						<button
							type="button"
							onClick={clearCanvas}
							className="text-xs text-gray-400 hover:text-gray-600"
						>
							Clear
						</button>
					</div>
				</div>

				{/* Text input */}
				<form className="w-full" onSubmit={handleSubmit}>
					<div className="flex items-center gap-2 bg-white/95 rounded-full px-4 py-2 shadow-lg">
						<textarea
							disabled={MAINTENANCE_GENERATION}
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
							style={{ height: "36px", lineHeight: "36px", paddingTop: 0, paddingBottom: 0 }}
							placeholder="Describe your app..."
							rows={1}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									e.currentTarget.form?.requestSubmit();
								}
							}}
						/>
						<Button
							type="submit"
							disabled={MAINTENANCE_GENERATION}
							className="rounded-full h-8 px-4 text-xs shrink-0"
						>
							Create
						</Button>
					</div>
				</form>

				{/* Suggestion chips */}
				<div className="flex flex-wrap justify-center gap-2">
					{COOL_APP_SUGGESTIONS.map((label) => (
						<button
							key={label}
							type="button"
							disabled={MAINTENANCE_GENERATION}
							onClick={handleSuggestionClick(label)}
							className="rounded-full text-xs px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 transition-colors whitespace-nowrap"
						>
							{label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
