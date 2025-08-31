/*
  Warnings:

  - You are about to drop the column `loadingPhotos` on the `PickupOrder` table. All the data in the column will be lost.
  - You are about to drop the column `loadingVideos` on the `PickupOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OperatorActivity" ADD COLUMN     "photoCount" INTEGER,
ADD COLUMN     "photo_urls" TEXT;

-- AlterTable
ALTER TABLE "PickupOrder" DROP COLUMN "loadingPhotos",
DROP COLUMN "loadingVideos",
ADD COLUMN     "loading_photo_count" INTEGER DEFAULT 0,
ADD COLUMN     "loading_photos" TEXT,
ADD COLUMN     "loading_videos" TEXT;

-- AlterTable
ALTER TABLE "PickupOrderStatusHistory" ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "upload_path" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_type" TEXT NOT NULL DEFAULT 'loading-photo',
    "metadata" JSONB,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_files_filename_key" ON "uploaded_files"("filename");

-- CreateIndex
CREATE INDEX "uploaded_files_file_type_idx" ON "uploaded_files"("file_type");

-- CreateIndex
CREATE INDEX "uploaded_files_uploaded_by_idx" ON "uploaded_files"("uploaded_by");

-- CreateIndex
CREATE INDEX "uploaded_files_created_at_idx" ON "uploaded_files"("created_at");

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
