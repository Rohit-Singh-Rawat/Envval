ALTER TABLE "user" ALTER COLUMN "avatar" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "avatar" SET DEFAULT 'avatar-1'::text;--> statement-breakpoint
DROP TYPE "public"."avatar_type";--> statement-breakpoint
CREATE TYPE "public"."avatar_type" AS ENUM('avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6', 'avatar-7', 'avatar-8', 'avatar-9', 'avatar-10');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "avatar" SET DEFAULT 'avatar-1'::"public"."avatar_type";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "avatar" SET DATA TYPE "public"."avatar_type" USING "avatar"::"public"."avatar_type";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "notification_preferences" SET DEFAULT '{"newRepoAdded":true,"newDeviceLogin":false}'::jsonb;