/*
  Warnings:

  - Added the required column `fileName` to the `ResumeProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResumeProfile" ADD COLUMN "fileName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ResumeProfile" ALTER COLUMN "fileName" DROP DEFAULT;
