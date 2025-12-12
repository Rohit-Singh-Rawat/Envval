CREATE TABLE "user_attribution" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source" text,
	"medium" text,
	"details" text,
	"referrer_url" text,
	"landing_page_url" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_attribution" ADD CONSTRAINT "user_attribution_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "userAttribution_userId_idx" ON "user_attribution" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "userAttribution_createdAt_idx" ON "user_attribution" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "userAttribution_source_idx" ON "user_attribution" USING btree ("source");--> statement-breakpoint
ALTER TABLE "device" DROP COLUMN "fingerprint";