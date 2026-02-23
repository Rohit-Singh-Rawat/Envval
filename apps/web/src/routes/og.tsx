import { Button } from "@envval/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { useCallback, useRef, useState } from "react";
import { EnvvalLogo } from "@/components/logo/envval";

export const Route = createFileRoute("/og")({
	component: OgPage,
});

function OgImagePreview({
	innerRef,
}: {
	innerRef: React.RefObject<HTMLDivElement | null>;
}) {
	return (
		<div
			ref={innerRef}
			style={{
				width: 1200,
				height: 630,
				position: "relative",
				overflow: "hidden",
				fontFamily: "'Satoshi-Variable', sans-serif",
				background: "oklch(0.9965 0.013 115.03)",
			}}
		>
			{/* Content layer */}
			<div
				style={{
					position: "relative",
					zIndex: 5,
					display: "flex",
					width: "100%",
					height: "100%",
					paddingTop: 56,
					gap: 0,
				}}
			>
				{/* Left column */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						width: "46%",
						padding: 32,
						paddingTop: 0,
					}}
				>
					{/* Logo */}
					<div style={{ display: "flex", alignItems: "center", gap: 0 }}>
						<EnvvalLogo variant="full" width={138} height={42} className="" />
					</div>

					{/* Tagline area */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 24,
							marginBottom: 42,
						}}
					>
						<h1
							style={{
								fontSize: 56,
								fontWeight: 500,
								lineHeight: 1.08,
								textShadow: "0 2px 4px rgba(0,0,0,0.1)",
								letterSpacing: "-0.03em",
								color: "#0f0f0f",
								margin: 0,
								fontFamily: "'Zodiak-Regular', serif",
							}}
						>
							Manage your
							<br />
							<span style={{ color: "var(--primary)" }}>secrets</span> securely
						</h1>
						<p
							style={{
								fontSize: 24,
								lineHeight: 1.5,
								color: "#6b6b6b",
								margin: 0,
								fontWeight: 400,
								maxWidth: 420,
								textShadow: "0 2px 4px rgba(0,0,0,0.1)",
							}}
						>
							Sync, share, and manage environment variables across your team
							without exposing sensitive data.
						</p>
					</div>
				</div>

				{/* Right column - Dashboard image */}
				<div
					style={{
						width: "54%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<div
						style={{
							width: "100%",
							height: "100%",
							borderRadius: "20px 0 0 0",
							border: "none",
							filter:
								"drop-shadow(-2px -2px 2px rgba(0, 0, 0, 0.02)) drop-shadow(-4px -4px 4px rgba(0, 0, 0, 0.025)) drop-shadow(-8px -8px 8px rgba(0, 0, 0, 0.03)) drop-shadow(-16px -16px 15px rgba(0, 0, 0, 0.035))",
							flexDirection: "column",
							position: "relative",
						}}
					>
						<img
							src="/images/og/dash.png"
							alt="Envval Dashboard"
							style={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
								borderRadius: "20px 0 0 0",
								objectPosition: "top left",
								border: "1px  solid rgba(0,0,0,0.08)",
								borderRight: "none",
								maskImage:
									"linear-gradient(to bottom, black 70%, transparent 100%)",
								WebkitMaskImage:
									"linear-gradient(to bottom, black 70%, transparent 100%)",
							}}
						/>
					</div>
				</div>
			</div>

			{/* Border */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					borderRadius: 0,
					border: "1px solid rgba(0,0,0,0.06)",
					zIndex: 20,
					pointerEvents: "none",
				}}
			/>
		</div>
	);
}

/* ─── Page ─── */

function OgPage() {
	const ogRef = useRef<HTMLDivElement>(null);
	const [downloading, setDownloading] = useState(false);

	const handleDownload = useCallback(async (scale: number) => {
		if (!ogRef.current) return;
		setDownloading(true);
		try {
			const dataUrl = await toPng(ogRef.current, {
				width: 1200,
				height: 630,
				pixelRatio: scale,
				cacheBust: true,
			});
			const link = document.createElement("a");
			link.download = `envval-og-${1200 * scale}x${630 * scale}.png`;
			link.href = dataUrl;
			link.click();
		} catch (err) {
			console.error("Failed to generate image:", err);
		} finally {
			setDownloading(false);
		}
	}, []);

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				padding: "48px 24px",
				gap: 32,
				fontFamily: "'Satoshi-Variable', sans-serif",
			}}
		>
			{/* Header */}
			<div style={{ textAlign: "center" }}>
				<h1
					style={{
						fontSize: 28,
						fontWeight: 500,
						color: "#0f0f0f",
						margin: 0,
						letterSpacing: "-0.02em",
						fontFamily: "'Zodiak-Regular', serif",
					}}
				>
					OG Image
				</h1>
			</div>

			{/* Preview container - scaled down to fit viewport */}
			<div
				className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden border"
				style={{ transform: "scale(0.75)", transformOrigin: "top center" }}
			>
				<OgImagePreview innerRef={ogRef} />
			</div>

			{/* Download buttons */}
			<div style={{ display: "flex", gap: 12 }}>
				<DownloadButton
					label="1x (1200×630)"
					onClick={() => handleDownload(1)}
					disabled={downloading}
				/>
				<DownloadButton
					label="2x (2400×1260)"
					onClick={() => handleDownload(2)}
					disabled={downloading}
					primary
				/>
				<DownloadButton
					label="4x (4800×2520)"
					onClick={() => handleDownload(4)}
					disabled={downloading}
				/>
			</div>

			{downloading && (
				<p style={{ fontSize: 13, color: "#888" }}>Generating image...</p>
			)}
		</div>
	);
}

function DownloadButton({
	label,
	onClick,
	disabled,
	primary = false,
}: {
	label: string;
	onClick: () => void;
	disabled: boolean;
	primary?: boolean;
}) {
	return (
		<Button
			type="button"
			onClick={onClick}
			disabled={disabled}
			variant={primary ? "default" : "outline"}
		>
			{label}
		</Button>
	);
}
