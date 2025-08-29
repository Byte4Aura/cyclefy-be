/*
  Warnings:

  - The values [cancelled] on the enum `barter_application_status_histories_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [cancelled] on the enum `barter_status_histories_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `barter_application_status_histories` MODIFY `status` ENUM('request_submitted', 'confirmed', 'completed', 'failed') NOT NULL DEFAULT 'request_submitted';

-- AlterTable
ALTER TABLE `barter_status_histories` MODIFY `status` ENUM('waiting_for_request', 'waiting_for_confirmation', 'confirmed', 'completed', 'failed') NOT NULL DEFAULT 'waiting_for_request';
