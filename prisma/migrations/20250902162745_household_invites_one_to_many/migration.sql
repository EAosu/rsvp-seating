/*
  Warnings:

  - You are about to drop the `PhoneInvite` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `phoneWa` to the `Invite` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Invite" DROP CONSTRAINT "Invite_householdId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PhoneInvite" DROP CONSTRAINT "PhoneInvite_eventId_fkey";

-- DropIndex
DROP INDEX "public"."Invite_householdId_key";

-- AlterTable
ALTER TABLE "public"."Invite" ADD COLUMN     "phoneWa" VARCHAR(32) NOT NULL,
ALTER COLUMN "householdId" DROP NOT NULL,
ALTER COLUMN "rsvpToken" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."PhoneInvite";

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "public"."Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;
