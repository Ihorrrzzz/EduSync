-- Rename the refresh token column so the database stores token digests instead of raw tokens.
ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";

-- Replace the legacy unique index with an index on the hashed token column.
DROP INDEX "refresh_tokens_token_key";
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_profile_id_idx" ON "refresh_tokens"("profile_id");

-- Ensure profile removal also cleans up dependent records.
ALTER TABLE "schools" DROP CONSTRAINT "schools_profile_id_fkey";
ALTER TABLE "schools"
  ADD CONSTRAINT "schools_profile_id_fkey"
  FOREIGN KEY ("profile_id")
  REFERENCES "profiles"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "clubs" DROP CONSTRAINT "clubs_profile_id_fkey";
ALTER TABLE "clubs"
  ADD CONSTRAINT "clubs_profile_id_fkey"
  FOREIGN KEY ("profile_id")
  REFERENCES "profiles"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_profile_id_fkey";
ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_profile_id_fkey"
  FOREIGN KEY ("profile_id")
  REFERENCES "profiles"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
