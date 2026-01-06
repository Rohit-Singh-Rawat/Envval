ALTER TABLE "user" ADD COLUMN "key_material_enc" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "key_material_iv" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "key_material_key_id" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "device" DROP COLUMN "public_key";--> statement-breakpoint
ALTER TABLE "device" DROP COLUMN "wrapped_user_key";