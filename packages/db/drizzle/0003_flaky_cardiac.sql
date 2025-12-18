ALTER TABLE "env_version" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "env_version" CASCADE;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "last_updated_by_device_id" text;--> statement-breakpoint
ALTER TABLE "environment" ADD CONSTRAINT "environment_last_updated_by_device_id_device_id_fk" FOREIGN KEY ("last_updated_by_device_id") REFERENCES "public"."device"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment" DROP COLUMN "latest_version_id";