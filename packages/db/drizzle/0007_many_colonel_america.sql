ALTER TABLE "session" ADD COLUMN "public_key" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "key_material_delivered" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "key_material_delivered_at" timestamp;