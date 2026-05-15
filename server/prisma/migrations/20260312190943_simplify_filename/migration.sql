/*
  Warnings:

  - You are about to drop the column `audioFilename` on the `Recording` table. All the data in the column will be lost.
  - You are about to drop the column `eventLogFilename` on the `Recording` table. All the data in the column will be lost.
  - Added the required column `baseFilename` to the `Recording` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Recording" DROP COLUMN "audioFilename",
DROP COLUMN "eventLogFilename",
ADD COLUMN     "baseFilename" TEXT NOT NULL;
