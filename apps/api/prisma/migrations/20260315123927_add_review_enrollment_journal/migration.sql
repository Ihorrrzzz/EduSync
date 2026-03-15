-- CreateEnum
CREATE TYPE "ProgramReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'RETURNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "club_programs" ADD COLUMN     "audience" TEXT;

-- CreateTable
CREATE TABLE "program_review_requests" (
    "id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "club_program_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "status" "ProgramReviewStatus" NOT NULL DEFAULT 'PENDING',
    "school_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_requests" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "parent_profile_id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "club_program_id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "enrollment_request_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "score_value" INTEGER NOT NULL,
    "score_max" INTEGER NOT NULL,
    "comment" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_review_requests_club_id_status_idx" ON "program_review_requests"("club_id", "status");

-- CreateIndex
CREATE INDEX "program_review_requests_school_id_status_idx" ON "program_review_requests"("school_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "program_review_requests_club_program_id_school_id_key" ON "program_review_requests"("club_program_id", "school_id");

-- CreateIndex
CREATE INDEX "enrollment_requests_club_id_status_idx" ON "enrollment_requests"("club_id", "status");

-- CreateIndex
CREATE INDEX "enrollment_requests_parent_profile_id_idx" ON "enrollment_requests"("parent_profile_id");

-- CreateIndex
CREATE INDEX "enrollment_requests_club_program_id_idx" ON "enrollment_requests"("club_program_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_requests_child_id_club_program_id_key" ON "enrollment_requests"("child_id", "club_program_id");

-- CreateIndex
CREATE INDEX "journal_entries_enrollment_request_id_idx" ON "journal_entries"("enrollment_request_id");

-- AddForeignKey
ALTER TABLE "program_review_requests" ADD CONSTRAINT "program_review_requests_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_review_requests" ADD CONSTRAINT "program_review_requests_club_program_id_fkey" FOREIGN KEY ("club_program_id") REFERENCES "club_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_review_requests" ADD CONSTRAINT "program_review_requests_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_requests" ADD CONSTRAINT "enrollment_requests_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_requests" ADD CONSTRAINT "enrollment_requests_parent_profile_id_fkey" FOREIGN KEY ("parent_profile_id") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_requests" ADD CONSTRAINT "enrollment_requests_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_requests" ADD CONSTRAINT "enrollment_requests_club_program_id_fkey" FOREIGN KEY ("club_program_id") REFERENCES "club_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_enrollment_request_id_fkey" FOREIGN KEY ("enrollment_request_id") REFERENCES "enrollment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
