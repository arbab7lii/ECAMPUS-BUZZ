-- AlterTable
ALTER TABLE "users" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "college" TEXT,
ADD COLUMN     "branch" TEXT,
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
