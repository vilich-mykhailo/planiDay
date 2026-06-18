-- AlterTable
ALTER TABLE "StudioScheduleDay" ADD COLUMN     "breakEndMin" INTEGER,
ADD COLUMN     "breakStartMin" INTEGER;

-- AlterTable
ALTER TABLE "StudioScheduleException" ADD COLUMN     "breakEndMin" INTEGER,
ADD COLUMN     "breakStartMin" INTEGER;
