-- CreateTable
CREATE TABLE `RecycleLocationImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recycle_location_id` INTEGER NOT NULL,
    `image_path` VARCHAR(255) NOT NULL,
    `image_name` VARCHAR(255) NOT NULL,
    `image_size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RecycleLocationImage` ADD CONSTRAINT `RecycleLocationImage_recycle_location_id_fkey` FOREIGN KEY (`recycle_location_id`) REFERENCES `recycle_locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
