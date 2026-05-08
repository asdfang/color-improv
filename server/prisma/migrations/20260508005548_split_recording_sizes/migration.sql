/*
  Warnings:

  - You are about to drop the column `fileSizeBytes` on the `Recording` table. All the data in the column will be lost.
  - Added the required column `audioFileSizeBytes` to the `Recording` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logFileSizeBytes` to the `Recording` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Recording" DROP COLUMN "fileSizeBytes",
ADD COLUMN     "audioFileSizeBytes" INTEGER NOT NULL,
ADD COLUMN     "logFileSizeBytes" INTEGER NOT NULL;
