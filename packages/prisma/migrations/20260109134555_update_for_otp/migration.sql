-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoLoginToken" TEXT,
ADD COLUMN     "autoLoginTokenExpires" TIMESTAMP(3);
