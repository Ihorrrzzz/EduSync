-- AlterTable
ALTER TABLE "club_programs" ADD COLUMN     "program_file_url" TEXT;

-- CreateIndex
CREATE INDEX "club_programs_is_published_idx" ON "club_programs"("is_published");

-- CreateIndex
CREATE INDEX "clubs_city_idx" ON "clubs"("city");

-- CreateIndex
CREATE INDEX "schools_city_idx" ON "schools"("city");
