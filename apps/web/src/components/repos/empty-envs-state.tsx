import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

const KEYS = [
	{ color: "text-sky-500", delay: 0.15, x: -68, y: -52, rotate: -22 },
	{ color: "text-indigo-500", delay: 0.25, x: 0, y: -72, rotate: 0 },
	{ color: "text-blue-500", delay: 0.35, x: 68, y: -48, rotate: 22 },
] as const;

const FOLDER = { width: 88, height: 64 } as const;

export function EmptyEnvsState() {
	const shouldReduceMotion = useReducedMotion();
	const [isHovered, setIsHovered] = useState(false);

	const tabWidth = FOLDER.width * 0.35;
	const tabHeight = FOLDER.height * 0.22;

	return (
		<div className="flex flex-col items-center justify-center gap-8 py-16">
			<div
				className="relative "
				style={{
					width: FOLDER.width,
					height: FOLDER.height + 75,
					perspective: 600,
					perspectiveOrigin: "center 80%",
				}}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<div
					className="absolute inset-0"
					style={{ transformStyle: "preserve-3d" }}
				>
					<div
						className="absolute bottom-0 left-0 rounded-lg bg-gradient-to-b from-sky-500 to-blue-600"
						style={{
							width: FOLDER.width,
							height: FOLDER.height,
							transform: "translateZ(-1px)",
							boxShadow: `
								0 4px 6px -1px rgba(0,0,0,0.1),
								0 2px 4px -2px rgba(0,0,0,0.1),
								inset 0 1px 0 rgba(255,255,255,0.1),
								inset 0 -1px 0 rgba(0,0,0,0.05)
							`,
						}}
					>
						<div
							className="absolute left-2 rounded-t-md bg-gradient-to-b from-sky-400 to-sky-500"
							style={{
								top: -tabHeight * 0.8,
								width: tabWidth,
								height: tabHeight - 1.2,
								zIndex: 1,
								boxShadow: `
									inset 0 1px 0 rgba(255,255,255,0.2),
									inset 1px 0 0 rgba(255,255,255,0.08),
									inset -1px 0 0 rgba(0,0,0,0.05),
								`,
								transform: "translateZ(2px)",
							}}
						></div>
						<div className="absolute inset-x-0 top-0 h-px bg-white/10" />
						<div className="absolute inset-x-2 top-3 h-px bg-sky-400/60" />
						<div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/5 to-transparent" />
					</div>

					{KEYS.map((key, index) => (
						<motion.div
							key={index}
							className={`absolute left-1/2 ${key.color}`}
							style={{
								bottom: FOLDER.height * 0.3,
								zIndex: 10,
								transformOrigin: "center bottom",
							}}
							initial={{ opacity: 0.9, x: "-50%", y: 0, scale: 0.8, rotate: 0 }}
							animate={
								shouldReduceMotion
									? {
											opacity: 0.85,
											x: `calc(-50% + ${key.x}px)`,
											y: key.y,
											scale: 1,
											rotate: key.rotate,
										}
									: {
											opacity: [0.9, 0.95, 0.85],
											x: ["-50%", `calc(-50% + ${key.x}px)`],
											y: [0, key.y - 8, key.y],
											scale: [0.8, 1.05, 1],
											rotate: [0, key.rotate * 1.1, key.rotate],
										}
							}
							transition={{ duration: 0.5, delay: key.delay, ease: EASE_OUT }}
						>
							<motion.div
								animate={
									shouldReduceMotion
										? {}
										: {
												y: [0, -5, 0],
												rotate: isHovered ? [0, -4, 4, 0] : [0, -2, 2, 0],
											}
								}
								transition={{
									duration: isHovered ? 2 : 4 + index * 0.5,
									delay: key.delay + 0.6,
									repeat: Infinity,
									ease: EASE_OUT,
								}}
							>
								<KeyIcon />
							</motion.div>
						</motion.div>
					))}

					<motion.div
						className="absolute bottom-0 left-0 overflow-hidden rounded-lg bg-gradient-to-b from-sky-400 to-blue-500"
						style={{
							width: FOLDER.width,
							height: FOLDER.height * 0.85,
							transformStyle: "preserve-3d",
							transformOrigin: "center bottom",
							zIndex: 20,
							backfaceVisibility: "hidden",
							boxShadow: `
								0 4px 8px -2px rgba(0,0,0,0.12),
								0 2px 4px -1px rgba(0,0,0,0.08),
								inset 0 1px 0 rgba(255,255,255,0.2),
								inset 0 -1px 0 rgba(0,0,0,0.05)
							`,
						}}
						initial={{ rotateX: 0 }}
						animate={{
							rotateX: shouldReduceMotion ? -40 : isHovered ? -40 : -45,
						}}
						transition={{
							type: "spring",
							stiffness: 200,
							damping: 15,
							delay: isHovered ? 0 : 0.05,
						}}
					>
						<div className="absolute inset-x-0 top-0 h-px bg-white/15" />
						<div className="absolute inset-x-2 top-2 h-px bg-sky-300/50" />
						<div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-blue-600/10 to-transparent" />
					</motion.div>
				</div>
			</div>

			<motion.div
				className="flex flex-col items-center gap-2 text-center"
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					duration: 0.4,
					delay: shouldReduceMotion ? 0.2 : 0.5,
					ease: EASE_OUT,
				}}
			>
				<p className="text-balance font-medium text-foreground">
					No Environment Files
				</p>
				<p className="max-w-xs text-pretty text-sm text-muted-foreground">
					Create your first{" "}
					<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
						.env
					</code>{" "}
					file to manage variables securely
				</p>
			</motion.div>
		</div>
	);
}

function KeyIcon() {
	return (
		<svg
			width="32"
			height="32"
			viewBox="0 0 104 81"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			strokeWidth="2px"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="drop-shadow-md"
			aria-hidden="true"
		>
			<path
				d="M91.6942 7.91211C85.0142 4.05211 77.0242 2.12205 67.7042 2.10205C58.3942 2.10205 50.4142 3.99227 43.7842 7.82227C38.6742 10.7723 35.5342 14.2821 34.3542 18.3521C34.0642 19.3621 33.9042 20.3621 33.8842 21.3521V22.1621C34.0242 24.8721 35.1641 27.5022 37.3141 30.0522L35.9242 30.8621H33.8842L25.5442 30.842C24.7442 30.842 24.0342 30.922 23.4042 31.092C22.7642 31.262 22.1842 31.5023 21.6542 31.8123C21.1242 32.1223 20.7142 32.4523 20.4142 32.8223C20.1142 33.1823 19.9742 33.5922 19.9742 34.0522L20.0042 40.0522L7.53418 40.8921C6.80418 40.9321 6.10415 41.0422 5.44415 41.2322C4.77415 41.4222 4.2142 41.6922 3.7442 42.0322C3.2842 42.3822 2.95415 42.7421 2.75415 43.1321C2.62415 43.3721 2.55418 43.6321 2.53418 43.8921V44.0022C2.53418 44.1122 2.54415 44.232 2.56415 44.342L3.92419 55.4622C3.98419 55.8822 4.17418 56.2821 4.47418 56.6421C4.77418 57.0121 5.19418 57.3521 5.72418 57.6521C6.26418 57.9621 6.84418 58.1823 7.47418 58.3223C8.11418 58.4523 8.76419 58.5222 9.42419 58.5222L17.6142 58.5422C18.4042 58.5422 19.1542 58.4622 19.8542 58.2822C19.9042 58.2722 19.9542 58.2622 19.9942 58.2422C20.6342 58.0822 21.2042 57.8523 21.6942 57.5723L33.3242 50.8521L36.4942 49.0222L50.9142 40.6921L53.3342 39.3022C59.4642 41.0022 66.0742 41.5822 73.1542 41.0422C77.0642 40.7422 80.7142 40.0522 84.1042 38.9622C86.8542 38.0922 89.4342 36.9623 91.8442 35.5723C93.8942 34.3923 95.6242 33.1322 97.0342 31.8022C100.174 28.8422 101.744 25.512 101.744 21.832V21.7622C101.714 16.3822 98.3642 11.7621 91.6942 7.91211ZM84.1042 24.5422C83.3442 26.0622 81.9142 27.4221 79.8242 28.6321C76.5142 30.5521 72.5242 31.5022 67.8642 31.4922C63.2042 31.4822 59.2141 30.512 55.8741 28.592C53.7441 27.362 52.2842 25.9721 51.5142 24.4221C51.0742 23.5521 50.8542 22.6321 50.8442 21.6621C50.8342 18.9721 52.4842 16.6722 55.7942 14.7622C59.1142 12.8422 63.1042 11.8921 67.7542 11.9021C72.4142 11.9121 76.4142 12.8722 79.7542 14.8022C83.0842 16.7322 84.7642 19.0422 84.7742 21.7222C84.7842 22.7122 84.5642 23.6522 84.1042 24.5422Z"
				stroke="currentColor"
				strokeLinejoin="round"
			/>
			<path
				d="M84.7738 21.7222C84.7838 22.7122 84.5638 23.6523 84.1038 24.5423C83.3438 26.0623 81.9138 27.4222 79.8238 28.6322C76.5138 30.5522 72.5238 31.5023 67.8638 31.4923C63.2038 31.4823 59.2138 30.5121 55.8738 28.5921C53.7438 27.3621 52.2838 25.9722 51.5138 24.4222C51.0738 23.5522 50.8538 22.6322 50.8438 21.6622C50.8338 18.9722 52.4838 16.6723 55.7938 14.7623C59.1138 12.8423 63.1038 11.8922 67.7538 11.9022C72.4138 11.9122 76.4138 12.8723 79.7538 14.8023C83.0838 16.7323 84.7638 19.0422 84.7738 21.7222Z"
				stroke="currentColor"
				strokeLinejoin="round"
			/>
			<path
				d="M53.3342 39.3022V59.3022L21.6942 77.5723C21.1642 77.8723 20.5542 78.1122 19.8542 78.2822C19.1542 78.4622 18.4042 78.5422 17.6142 78.5422L9.42419 78.5222C8.76419 78.5222 8.11418 78.4523 7.47418 78.3223C6.84418 78.1823 6.26418 77.9621 5.72418 77.6521C5.19418 77.3521 4.77418 77.0121 4.47418 76.6421C4.17418 76.2821 3.98419 75.8822 3.92419 75.4622L2.56415 64.342C2.54415 64.242 2.53418 64.1222 2.53418 64.0222V44.0022C2.53418 44.1122 2.54415 44.232 2.56415 44.342L3.92419 55.4622C3.98419 55.8822 4.17418 56.2821 4.47418 56.6421C4.77418 57.0121 5.19418 57.3521 5.72418 57.6521C6.26418 57.9621 6.84418 58.1823 7.47418 58.3223C8.11418 58.4523 8.76419 58.5222 9.42419 58.5222L17.6142 58.5422C18.4042 58.5422 19.1542 58.4622 19.8542 58.2822C19.9042 58.2722 19.9542 58.2622 19.9942 58.2422C20.6342 58.0822 21.2042 57.8523 21.6942 57.5723L33.3242 50.8521L36.4942 49.0222L50.9142 40.6921L53.3342 39.3022Z"
				stroke="currentColor"
				strokeLinejoin="round"
			/>
			<path
				d="M101.744 21.832V41.7622C101.774 47.1322 98.474 51.7423 91.844 55.5723C86.464 58.6723 80.244 60.4922 73.154 61.0422C66.074 61.5822 59.464 61.0022 53.334 59.3022V39.3022C59.464 41.0022 66.074 41.5822 73.154 41.0422C77.064 40.7422 80.714 40.0522 84.104 38.9622C86.854 38.0922 89.434 36.9623 91.844 35.5723C93.894 34.3923 95.624 33.1322 97.034 31.8022C100.174 28.8422 101.744 25.512 101.744 21.832Z"
				stroke="currentColor"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
