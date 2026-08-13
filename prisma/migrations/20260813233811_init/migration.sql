-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LEVEL_RESPONSIBLE');

-- CreateEnum
CREATE TYPE "Period" AS ENUM ('MANHA', 'TARDE', 'NOITE');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('ATIVA', 'PLANEJAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('GERAL', 'PAIS_PADRINHOS', 'INFANTIL', 'CRIANCAS', 'ADOLESCENTES', 'JOVENS', 'ADULTOS', 'CATEQUISTAS');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLICO', 'AUTENTICADO');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('CONFIRMADO', 'ADIADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('GERAL', 'PAIS_PADRINHOS', 'INFANTIL', 'CRIANCAS', 'ADOLESCENTES', 'JOVENS', 'ADULTOS', 'FORMACAO_CATEQUISTAS');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ROTEIRO', 'DOCUMENTO', 'APRESENTACAO', 'ATIVIDADE', 'DINAMICA', 'FORMULARIO', 'MATERIAL_FORMACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PUBLICO', 'AUTENTICADO', 'ADMIN');

-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "responsibleLevelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "usesYearRange" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "communityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catechists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catechists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catechists_on_classes" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "catechistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catechists_on_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "period" "Period" NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "roomId" TEXT,
    "status" "ClassStatus" NOT NULL DEFAULT 'PLANEJAMENTO',
    "startYear" INTEGER,
    "endYear" INTEGER,
    "suffix" INTEGER,
    "catechumensCountOverride" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_year_records" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "roomId" TEXT,
    "catechumensCount" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_year_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_year_record_catechists" (
    "id" TEXT NOT NULL,
    "yearRecordId" TEXT NOT NULL,
    "catechistId" TEXT NOT NULL,

    CONSTRAINT "class_year_record_catechists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catechumens" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "baptized" BOOLEAN NOT NULL DEFAULT false,
    "firstEucharist" BOOLEAN NOT NULL DEFAULT false,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catechumens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "communityId" TEXT,
    "levelId" TEXT,
    "category" "EventCategory" NOT NULL,
    "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLICO',
    "status" "EventStatus" NOT NULL DEFAULT 'CONFIRMADO',
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "category" "DocumentCategory" NOT NULL,
    "type" "DocumentType" NOT NULL,
    "year" INTEGER,
    "levelId" TEXT,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'AUTENTICADO',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "levelId" TEXT,
    "communityId" TEXT,
    "highlighted" BOOLEAN NOT NULL DEFAULT false,
    "status" "NoticeStatus" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_responsibleLevelId_key" ON "users"("responsibleLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "communities_sigla_key" ON "communities"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "levels_slug_key" ON "levels"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "levels_order_key" ON "levels"("order");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_communityId_name_key" ON "rooms"("communityId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "catechists_on_classes_classId_catechistId_key" ON "catechists_on_classes"("classId", "catechistId");

-- CreateIndex
CREATE UNIQUE INDEX "classes_publicId_key" ON "classes"("publicId");

-- CreateIndex
CREATE INDEX "classes_communityId_idx" ON "classes"("communityId");

-- CreateIndex
CREATE INDEX "classes_levelId_idx" ON "classes"("levelId");

-- CreateIndex
CREATE INDEX "classes_status_idx" ON "classes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "class_year_records_classId_year_key" ON "class_year_records"("classId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "class_year_record_catechists_yearRecordId_catechistId_key" ON "class_year_record_catechists"("yearRecordId", "catechistId");

-- CreateIndex
CREATE INDEX "catechumens_classId_idx" ON "catechumens"("classId");

-- CreateIndex
CREATE INDEX "calendar_events_date_idx" ON "calendar_events"("date");

-- CreateIndex
CREATE INDEX "calendar_events_category_idx" ON "calendar_events"("category");

-- CreateIndex
CREATE INDEX "repository_documents_category_idx" ON "repository_documents"("category");

-- CreateIndex
CREATE INDEX "repository_documents_visibility_idx" ON "repository_documents"("visibility");

-- CreateIndex
CREATE INDEX "notices_status_idx" ON "notices"("status");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_responsibleLevelId_fkey" FOREIGN KEY ("responsibleLevelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catechists_on_classes" ADD CONSTRAINT "catechists_on_classes_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catechists_on_classes" ADD CONSTRAINT "catechists_on_classes_catechistId_fkey" FOREIGN KEY ("catechistId") REFERENCES "catechists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_year_records" ADD CONSTRAINT "class_year_records_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_year_records" ADD CONSTRAINT "class_year_records_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_year_record_catechists" ADD CONSTRAINT "class_year_record_catechists_yearRecordId_fkey" FOREIGN KEY ("yearRecordId") REFERENCES "class_year_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_year_record_catechists" ADD CONSTRAINT "class_year_record_catechists_catechistId_fkey" FOREIGN KEY ("catechistId") REFERENCES "catechists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catechumens" ADD CONSTRAINT "catechumens_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_documents" ADD CONSTRAINT "repository_documents_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
