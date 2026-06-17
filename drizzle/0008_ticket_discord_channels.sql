ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "discord_channel_id" varchar(255);

DO $$ BEGIN
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_discord_channel_id_unique" UNIQUE("discord_channel_id");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;