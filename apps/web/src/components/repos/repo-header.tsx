import { Button } from "@envval/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@envval/ui/components/dropdown-menu";
import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete01Icon,
  GitBranchIcon,
  MoreVerticalIcon,
} from "hugeicons-react";
import { useState } from "react";
import { useRepoSummaryBySlug } from "@/hooks/envs/use-repo-envs";
import { DeleteRepoDialog } from "./delete-repo-dialog";

interface RepoHeaderProps {
  slug: string;
}

export function RepoHeader({ slug }: RepoHeaderProps) {
  const { data: repoSummary } = useRepoSummaryBySlug(slug);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    if (
      repoSummary &&
      "gitRemoteUrl" in repoSummary &&
      repoSummary.gitRemoteUrl
    ) {
      await navigator.clipboard.writeText(repoSummary.gitRemoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!repoSummary || "error" in repoSummary) {
    return (
      <header className="w-full bg-background">
        <div className="flex items-center gap-4 w-full">
          <div className="text-destructive">Error loading repository</div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="w-full bg-background">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl font-semibold truncate">
              {repoSummary.name}
            </h1>
            {repoSummary.gitRemoteUrl && (
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group w-fit"
                aria-label="Copy git remote URL"
              >
                <GitBranchIcon
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate max-w-[280px]">
                  {repoSummary.gitRemoteUrl}
                </span>
                {copied ? (
                  <CheckmarkCircle02Icon
                    className="size-3.5 text-emerald-500 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Copy01Icon
                    className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Repository options"
                >
                  <MoreVerticalIcon className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {repoSummary.gitRemoteUrl && (
                  <>
                    <DropdownMenuItem onClick={handleCopyUrl}>
                      <Copy01Icon className="size-4 mr-2" aria-hidden="true" />
                      Copy Git URL
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Delete01Icon className="size-4 mr-2" aria-hidden="true" />
                  Delete Repository
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <DeleteRepoDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        repo={{ name: repoSummary.name, slug: repoSummary.slug }}
      />
    </>
  );
}
