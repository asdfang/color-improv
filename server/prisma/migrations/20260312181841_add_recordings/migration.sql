-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audioFilename" TEXT NOT NULL,
    "eventLogFilename" TEXT NOT NULL,
    "durationSeconds" DOUBLE PRECISION NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "audioMimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
