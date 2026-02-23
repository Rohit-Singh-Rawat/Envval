import * as React from "react";

/**
 * Interface for the Command Menu state and controls.
 */
interface CommandMenuContextType {
	/** Whether the command menu dialog is currently open. */
	open: boolean;
	/** Programmatically set the open state. */
	setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
	/** Toggle the current open state. */
	toggle: () => void;
}

const CommandMenuContext = React.createContext<
	CommandMenuContextType | undefined
>(undefined);

/**
 * Provider component that manages the global state of the Command Menu.
 * Handles the '⌘K' / 'Ctrl+K' global keyboard shortcut.
 */
export function CommandMenuProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [open, setOpen] = React.useState(false);

	const toggle = React.useCallback(() => {
		setOpen((prev) => !prev);
	}, []);

	// Global keyboard shortcut listener
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Check for ⌘K (Mac) or Ctrl+K (Windows/Linux)
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				toggle();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [toggle]);

	const value = React.useMemo(
		() => ({ open, setOpen, toggle }),
		[open, setOpen, toggle],
	);

	return (
		<CommandMenuContext.Provider value={value}>
			{children}
		</CommandMenuContext.Provider>
	);
}

/**
 * Hook to access and control the Command Menu from any component.
 * Must be used within a `CommandMenuProvider`.
 */
export function useCommandMenu() {
	const context = React.useContext(CommandMenuContext);
	if (context === undefined) {
		throw new Error("useCommandMenu must be used within a CommandMenuProvider");
	}
	return context;
}
