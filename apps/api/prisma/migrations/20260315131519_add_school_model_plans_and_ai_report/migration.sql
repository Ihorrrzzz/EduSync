-- AlterTable
ALTER TABLE "program_review_requests" ADD COLUMN     "ai_coverage_percent" INTEGER,
ADD COLUMN     "ai_report_json" JSONB,
ADD COLUMN     "ai_verdict" TEXT;

-- CreateTable
CREATE TABLE "school_model_plans" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "subject_area" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_model_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "school_model_plans_school_id_idx" ON "school_model_plans"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_model_plans_school_id_subject_area_key" ON "school_model_plans"("school_id", "subject_area");

-- AddForeignKey
ALTER TABLE "school_model_plans" ADD CONSTRAINT "school_model_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
