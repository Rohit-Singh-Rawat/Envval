ALTER TABLE "repo" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
CREATE INDEX "repo_slug_userId_idx" ON "repo" USING btree ("slug","user_id");