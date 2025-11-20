-- AlterTable
ALTER TABLE "public"."Guest" ADD COLUMN IF NOT EXISTS "invitedSeats" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."Guest" ADD COLUMN IF NOT EXISTS "confirmedSeats" INTEGER;

