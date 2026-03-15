ALTER TABLE "profiles" ADD COLUMN "login" TEXT;
ALTER TABLE "parent_profiles" ADD COLUMN "phone" TEXT;
ALTER TABLE "schools" ADD COLUMN "principal_full_name" TEXT;
ALTER TABLE "schools" ADD COLUMN "phone" TEXT;
ALTER TABLE "clubs" ADD COLUMN "admin_full_name" TEXT;
ALTER TABLE "clubs" ADD COLUMN "phone" TEXT;

CREATE UNIQUE INDEX "profiles_login_key" ON "profiles"("login");
