"use client";

import { useState } from "react";

const CORRECT_PASSWORD = "1111";

export function PasswordGate({ children }: { children: React.ReactNode }) {
	const [input, setInput] = useState("");
	const [unlocked, setUnlocked] = useState(false);
	const [error, setError] = useState(false);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (input === CORRECT_PASSWORD) {
			setUnlocked(true);
		} else {
			setError(true);
			setInput("");
			setTimeout(() => setError(false), 1500);
		}
	}

	if (unlocked) {
		return <>{children}</>;
	}

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				backgroundColor: "#000",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 9999,
			}}
		>
			<form
				onSubmit={handleSubmit}
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "16px",
				}}
			>
				<label
					htmlFor="password-input"
					style={{ color: "#fff", fontSize: "1.25rem", letterSpacing: "0.05em" }}
				>
					Enter Password
				</label>
				<input
					id="password-input"
					type="password"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					autoFocus
					style={{
						padding: "10px 16px",
						borderRadius: "6px",
						border: error ? "2px solid #f87171" : "2px solid #444",
						backgroundColor: "#111",
						color: "#fff",
						fontSize: "1.25rem",
						outline: "none",
						width: "180px",
						textAlign: "center",
						letterSpacing: "0.3em",
					}}
					placeholder="••••"
				/>
				{error && (
					<span style={{ color: "#f87171", fontSize: "0.9rem" }}>
						Incorrect password
					</span>
				)}
				<button
					type="submit"
					style={{
						padding: "10px 32px",
						borderRadius: "6px",
						backgroundColor: "#fff",
						color: "#000",
						fontWeight: 600,
						fontSize: "1rem",
						cursor: "pointer",
						border: "none",
					}}
				>
					Unlock
				</button>
			</form>
		</div>
	);
}
