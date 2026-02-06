import * as React from 'react';
import { Button } from '@envval/ui/components/button';
import {
	ResponsiveAlert,
	ResponsiveAlertContent,
	ResponsiveAlertHeader,
	ResponsiveAlertFooter,
	ResponsiveAlertTitle,
} from '@envval/ui/components/responsive-alert';
import { useDeleteRepo } from '@/hooks/repos/use-delete-repo';
import { Input } from '@envval/ui/components/input';
import { Copy01Icon, Tick01Icon, ArrowTurnBackwardIcon } from 'hugeicons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@envval/ui/components/tooltip';

type DeleteRepoDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	repo: {
		name: string;
		slug: string;
	};
};

function InlineCopyButton({ text }: { text: string }) {
	const [copied, setCopied] = React.useState(false);

	const handleCopy = async (e: React.MouseEvent) => {
		e.preventDefault();
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={handleCopy}
					className="inline-flex items-center gap-1.5 rounded border bg-muted/50 px-2 py-0.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
					aria-label={copied ? 'Copied!' : 'Copy repository name'}
				>
					<span>{text}</span>
					{copied ? (
						<Tick01Icon className="size-3.5 text-green-500" aria-hidden="true" />
					) : (
						<Copy01Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
					)}
				</button>
			</TooltipTrigger>
			<TooltipContent>
				<p>{copied ? 'Copied!' : 'Click to copy'}</p>
			</TooltipContent>
		</Tooltip>
	);
}

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="pointer-events-none ml-1.5 inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
			{children}
		</kbd>
	);
}

/**
 * Confirmation alert dialog for deleting a repository.
 * Uses AlertDialog which prevents dismissal by clicking outside.
 * Requires user to type the repository name to confirm deletion.
 */
export function DeleteRepoDialog({ open, onOpenChange, repo }: DeleteRepoDialogProps) {
	const [confirmText, setConfirmText] = React.useState('');
	const deleteRepo = useDeleteRepo();

	const isConfirmed = confirmText === repo.name;

	const handleDelete = async () => {
		if (!isConfirmed || deleteRepo.isPending) return;

		await deleteRepo.mutateAsync({ slug: repo.slug });
		onOpenChange(false);
		setConfirmText('');
	};

	const handleOpenChange = (value: boolean) => {
		if (!value) {
			setConfirmText('');
		}
		onOpenChange(value);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && isConfirmed && !deleteRepo.isPending) {
			e.preventDefault();
			handleDelete();
		}
	};

	return (
		<ResponsiveAlert open={open} onOpenChange={handleOpenChange}>
			<ResponsiveAlertContent>
				<ResponsiveAlertHeader>
					<ResponsiveAlertTitle>Delete Repository</ResponsiveAlertTitle>
				</ResponsiveAlertHeader>

				<div className="mt-1 space-y-4">
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">
							Are you sure you want to delete this repository?
						</p>
						<p className="text-sm font-medium text-destructive">
							This can not be undone.
						</p>
					</div>

					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">
							Type <InlineCopyButton text={repo.name} /> to confirm.
						</p>
						<Input
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Enter repository name"
							autoComplete="off"
							autoFocus
						/>
					</div>
				</div>

				<ResponsiveAlertFooter className="mt-6">
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={!isConfirmed}
						pending={deleteRepo.isPending}
						pendingText="Deleting..."
					>
						Delete Repository
						<ArrowTurnBackwardIcon className="size-3.5 rotate-180" aria-hidden="true" />
					</Button>
					<Button
						variant="outline"
						type="button"
						onClick={() => onOpenChange(false)}
					>
						Cancel
						<Kbd>Esc</Kbd>
					</Button>
				</ResponsiveAlertFooter>
			</ResponsiveAlertContent>
		</ResponsiveAlert>
	);
}
