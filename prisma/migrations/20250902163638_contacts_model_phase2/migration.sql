/*
  Warnings:

  - A unique constraint covering the columns `[eventId,contactId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."RsvpScope" AS ENUM ('ALL_LINKED', 'PRIMARY_ONLY');

-- CreateEnum
CREATE TYPE "public"."ContactRole" AS ENUM ('PRIMARY', 'PROXY', 'OTHER');

-- DropForeignKey
ALTER TABLE "public"."Guest" DROP CONSTRAINT "Guest_householdId_fkey";

-- AlterTable
ALTER TABLE "public"."Guest" ADD COLUMN     "group" TEXT,
ALTER COLUMN "householdId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Invite" ADD COLUMN     "contactId" TEXT,
ALTER COLUMN "phoneWa" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "phoneWa" VARCHAR(32) NOT NULL,
    "displayName" TEXT,
    "scope" "public"."RsvpScope" NOT NULL DEFAULT 'ALL_LINKED',
    "notes" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactGuest" (
    "contactId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "role" "public"."ContactRole" NOT NULL DEFAULT 'PRIMARY',

    CONSTRAINT "ContactGuest_pkey" PRIMARY KEY ("contactId","guestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contact_eventId_phoneWa_key" ON "public"."Contact"("eventId", "phoneWa");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_eventId_contactId_key" ON "public"."Invite"("eventId", "contactId");

-- AddForeignKey
ALTER TABLE "public"."Guest" ADD CONSTRAINT "Guest_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "public"."Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContactGuest" ADD CONSTRAINT "ContactGuest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContactGuest" ADD CONSTRAINT "ContactGuest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "public"."Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
