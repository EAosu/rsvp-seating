/*
  Warnings:

  - You are about to drop the column `attendeesCount` on the `Guest` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Guest` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Guest` table. All the data in the column will be lost.
  - You are about to alter the column `phoneWa` on the `Guest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - Made the column `householdId` on table `Guest` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Guest" DROP CONSTRAINT "Guest_householdId_fkey";

-- AlterTable
ALTER TABLE "public"."Guest" DROP COLUMN "attendeesCount",
DROP COLUMN "notes",
DROP COLUMN "updatedAt",
ALTER COLUMN "householdId" SET NOT NULL,
ALTER COLUMN "phoneWa" SET DATA TYPE VARCHAR(32);

-- CreateTable
CREATE TABLE "public"."PhoneInvite" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "phoneWa" VARCHAR(32) NOT NULL,
    "status" "public"."InviteStatus" NOT NULL DEFAULT 'SENT',
    "lastSentAt" TIMESTAMP(3),

    CONSTRAINT "PhoneInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneInvite_eventId_phoneWa_key" ON "public"."PhoneInvite"("eventId", "phoneWa");

-- AddForeignKey
ALTER TABLE "public"."Guest" ADD CONSTRAINT "Guest_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "public"."Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhoneInvite" ADD CONSTRAINT "PhoneInvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
