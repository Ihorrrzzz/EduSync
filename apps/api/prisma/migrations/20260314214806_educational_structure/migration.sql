-- CreateTable
CREATE TABLE "Educational_Institutions" (
    "Institution_ID" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6),
    "city" VARCHAR(50),
    "address" VARCHAR(200),
    "postal_code" VARCHAR(5),
    "phone_number" VARCHAR(10),
    "email" VARCHAR(50),

    CONSTRAINT "Educational_Institutions_pkey" PRIMARY KEY ("Institution_ID")
);

-- CreateTable
CREATE TABLE "Formal_Institutions" (
    "F_Institution_ID" INTEGER NOT NULL,
    "school_name" VARCHAR(100),

    CONSTRAINT "Formal_Institutions_pkey" PRIMARY KEY ("F_Institution_ID")
);

-- CreateTable
CREATE TABLE "Non_Formal_Institutions" (
    "NF_Institution_ID" INTEGER NOT NULL,
    "institution_name" VARCHAR(100),

    CONSTRAINT "Non_Formal_Institutions_pkey" PRIMARY KEY ("NF_Institution_ID")
);

-- CreateTable
CREATE TABLE "Agreements" (
    "Agreement_code" VARCHAR(10) NOT NULL,
    "valid_from" TIMESTAMP(6),
    "valid_to" TIMESTAMP(6),

    CONSTRAINT "Agreements_pkey" PRIMARY KEY ("Agreement_code")
);

-- CreateTable
CREATE TABLE "F2F_Cooperations" (
    "FF_agreement_code" VARCHAR(10) NOT NULL,
    "f_school_1_id" INTEGER,
    "f_school_2_id" INTEGER,

    CONSTRAINT "F2F_Cooperations_pkey" PRIMARY KEY ("FF_agreement_code")
);

-- CreateTable
CREATE TABLE "F2NF_Cooperations" (
    "FNF_agreement_code" VARCHAR(10) NOT NULL,
    "f_school_id" INTEGER,
    "nf_school_id" INTEGER,

    CONSTRAINT "F2NF_Cooperations_pkey" PRIMARY KEY ("FNF_agreement_code")
);

-- CreateTable
CREATE TABLE "Students" (
    "Student_ID" INTEGER NOT NULL,
    "f_school_id" INTEGER,
    "first_name" VARCHAR(20),
    "last_name" VARCHAR(40),
    "grade" INTEGER,

    CONSTRAINT "Students_pkey" PRIMARY KEY ("Student_ID")
);

-- CreateTable
CREATE TABLE "Students_NF_institutions" (
    "student_id" INTEGER NOT NULL,
    "nf_institution_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(6),
    "ended_at" TIMESTAMP(6),
    "study_load" INTEGER,

    CONSTRAINT "Students_NF_institutions_pkey" PRIMARY KEY ("student_id","nf_institution_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Educational_Institutions_phone_number_key" ON "Educational_Institutions"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Educational_Institutions_email_key" ON "Educational_Institutions"("email");

-- AddForeignKey
ALTER TABLE "Formal_Institutions" ADD CONSTRAINT "Formal_Institutions_F_Institution_ID_fkey" FOREIGN KEY ("F_Institution_ID") REFERENCES "Educational_Institutions"("Institution_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Non_Formal_Institutions" ADD CONSTRAINT "Non_Formal_Institutions_NF_Institution_ID_fkey" FOREIGN KEY ("NF_Institution_ID") REFERENCES "Educational_Institutions"("Institution_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F2F_Cooperations" ADD CONSTRAINT "F2F_Cooperations_FF_agreement_code_fkey" FOREIGN KEY ("FF_agreement_code") REFERENCES "Agreements"("Agreement_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F2F_Cooperations" ADD CONSTRAINT "F2F_Cooperations_f_school_1_id_fkey" FOREIGN KEY ("f_school_1_id") REFERENCES "Formal_Institutions"("F_Institution_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F2F_Cooperations" ADD CONSTRAINT "F2F_Cooperations_f_school_2_id_fkey" FOREIGN KEY ("f_school_2_id") REFERENCES "Formal_Institutions"("F_Institution_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F2NF_Cooperations" ADD CONSTRAINT "F2NF_Cooperations_FNF_agreement_code_fkey" FOREIGN KEY ("FNF_agreement_code") REFERENCES "Agreements"("Agreement_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F2NF_Cooperations" ADD CONSTRAINT "F2NF_Cooperations_f_school_id_fkey" FOREIGN KEY ("f_school_id") REFERENCES "Formal_Institutions"("F_Institution_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F2NF_Cooperations" ADD CONSTRAINT "F2NF_Cooperations_nf_school_id_fkey" FOREIGN KEY ("nf_school_id") REFERENCES "Non_Formal_Institutions"("NF_Institution_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Students" ADD CONSTRAINT "Students_f_school_id_fkey" FOREIGN KEY ("f_school_id") REFERENCES "Formal_Institutions"("F_Institution_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Students_NF_institutions" ADD CONSTRAINT "Students_NF_institutions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Students"("Student_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Students_NF_institutions" ADD CONSTRAINT "Students_NF_institutions_nf_institution_id_fkey" FOREIGN KEY ("nf_institution_id") REFERENCES "Non_Formal_Institutions"("NF_Institution_ID") ON DELETE RESTRICT ON UPDATE CASCADE;
