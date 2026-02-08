CREATE TYPE "public"."avatar_type" AS ENUM('avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6', 'avatar-7', 'avatar-8', 'avatar-9', 'avatar-10', 'avatar-11', 'avatar-12');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "avatar" "avatar_type" DEFAULT 'avatar-1' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notification_preferences" jsonb DEFAULT '{"newRepoAdded":true,"newDeviceLogin":true}'::jsonb NOT NULL;