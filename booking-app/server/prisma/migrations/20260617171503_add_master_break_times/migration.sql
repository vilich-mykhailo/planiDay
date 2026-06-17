-- AlterTable
ALTER TABLE "MasterScheduleDay" ADD COLUMN     "breakEndMin" INTEGER,
ADD COLUMN     "breakStartMin" INTEGER;

-- AlterTable
ALTER TABLE "MasterScheduleException" ADD COLUMN     "breakEndMin" INTEGER,
ADD COLUMN     "breakStartMin" INTEGER;
