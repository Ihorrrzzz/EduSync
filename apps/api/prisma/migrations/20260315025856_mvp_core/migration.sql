-- CreateEnum
CREATE TYPE "RecognitionScope" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "RecognitionRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'AI_READY', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RecommendationBand" AS ENUM ('strong', 'possible', 'weak');

-- CreateEnum
CREATE TYPE "RecommendedSchoolAction" AS ENUM ('full_candidate', 'partial_candidate', 'manual_review');

-- CreateEnum
CREATE TYPE "AnalysisConfidence" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "SchoolDecision" AS ENUM ('APPROVE', 'PARTIAL', 'REQUEST_CHANGES', 'REJECT');

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" TEXT NOT NULL,
    "parent_profile_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "grade" INTEGER NOT NULL,
    "school_id" TEXT,
    "school_name_snapshot" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_programs" (
    "id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject_area" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "full_description" TEXT NOT NULL,
    "age_min" INTEGER,
    "age_max" INTEGER,
    "grade_min" INTEGER,
    "grade_max" INTEGER,
    "modules" JSONB NOT NULL,
    "learning_outcomes" JSONB NOT NULL,
    "evaluation_method" TEXT NOT NULL,
    "report_format_summary" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recognition_requests" (
    "id" TEXT NOT NULL,
    "parent_profile_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "club_program_id" TEXT NOT NULL,
    "target_subject" TEXT NOT NULL,
    "target_grade" INTEGER NOT NULL,
    "recognition_scope" "RecognitionScope" NOT NULL,
    "parent_note" TEXT,
    "club_evidence_summary" TEXT,
    "attendance_rate" INTEGER,
    "external_performance_band" TEXT,
    "status" "RecognitionRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recognition_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recognition_ai_analyses" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "provider" TEXT,
    "model_name" TEXT,
    "compatibility_score" INTEGER NOT NULL,
    "recommendation_band" "RecommendationBand" NOT NULL,
    "recommended_school_action" "RecommendedSchoolAction" NOT NULL,
    "confidence" "AnalysisConfidence" NOT NULL,
    "summary" TEXT NOT NULL,
    "matched_outcomes" JSONB NOT NULL,
    "gaps" JSONB NOT NULL,
    "suggested_evidence" JSONB NOT NULL,
    "safe_band_explanation" TEXT NOT NULL,
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recognition_ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recognition_decisions" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "decision" "SchoolDecision" NOT NULL,
    "comment" TEXT NOT NULL,
    "recognized_topics" JSONB,
    "decided_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recognition_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_profile_id_key" ON "parent_profiles"("profile_id");

-- CreateIndex
CREATE INDEX "children_parent_profile_id_idx" ON "children"("parent_profile_id");

-- CreateIndex
CREATE INDEX "children_school_id_idx" ON "children"("school_id");

-- CreateIndex
CREATE INDEX "club_programs_club_id_idx" ON "club_programs"("club_id");

-- CreateIndex
CREATE INDEX "club_programs_subject_area_idx" ON "club_programs"("subject_area");

-- CreateIndex
CREATE INDEX "recognition_requests_parent_profile_id_idx" ON "recognition_requests"("parent_profile_id");

-- CreateIndex
CREATE INDEX "recognition_requests_school_id_status_idx" ON "recognition_requests"("school_id", "status");

-- CreateIndex
CREATE INDEX "recognition_requests_club_id_status_idx" ON "recognition_requests"("club_id", "status");

-- CreateIndex
CREATE INDEX "recognition_requests_child_id_idx" ON "recognition_requests"("child_id");

-- CreateIndex
CREATE INDEX "recognition_requests_club_program_id_idx" ON "recognition_requests"("club_program_id");

-- CreateIndex
CREATE UNIQUE INDEX "recognition_ai_analyses_request_id_key" ON "recognition_ai_analyses"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "recognition_decisions_request_id_key" ON "recognition_decisions"("request_id");

-- CreateIndex
CREATE INDEX "recognition_decisions_school_id_idx" ON "recognition_decisions"("school_id");

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_parent_profile_id_fkey" FOREIGN KEY ("parent_profile_id") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_programs" ADD CONSTRAINT "club_programs_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_requests" ADD CONSTRAINT "recognition_requests_parent_profile_id_fkey" FOREIGN KEY ("parent_profile_id") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_requests" ADD CONSTRAINT "recognition_requests_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_requests" ADD CONSTRAINT "recognition_requests_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_requests" ADD CONSTRAINT "recognition_requests_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_requests" ADD CONSTRAINT "recognition_requests_club_program_id_fkey" FOREIGN KEY ("club_program_id") REFERENCES "club_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_ai_analyses" ADD CONSTRAINT "recognition_ai_analyses_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "recognition_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_decisions" ADD CONSTRAINT "recognition_decisions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "recognition_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_decisions" ADD CONSTRAINT "recognition_decisions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
