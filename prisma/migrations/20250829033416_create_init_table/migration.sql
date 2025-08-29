-- CreateTable
CREATE TABLE `barters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `address_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `phone_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barter_status_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barter_id` INTEGER NOT NULL,
    `status` ENUM('waiting_for_request', 'waiting_for_confirmation', 'confirmed', 'completed', 'failed') NOT NULL DEFAULT 'waiting_for_request',
    `status_detail` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barter_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barter_id` INTEGER NOT NULL,
    `image_path` VARCHAR(255) NOT NULL,
    `image_name` VARCHAR(255) NOT NULL,
    `image_size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barter_applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barter_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `address_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `phone_id` INTEGER NOT NULL,
    `decline_reason` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barter_application_status_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barter_application_id` INTEGER NOT NULL,
    `status` ENUM('request_submitted', 'confirmed', 'completed', 'failed') NOT NULL DEFAULT 'request_submitted',
    `status_detail` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barter_application_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barter_application_id` INTEGER NOT NULL,
    `image_path` VARCHAR(255) NOT NULL,
    `image_name` VARCHAR(255) NOT NULL,
    `image_size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `address_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `phone_id` INTEGER NOT NULL,
    `duration_from` DATETIME(3) NOT NULL,
    `duration_to` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrow_status_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `borrow_id` INTEGER NOT NULL,
    `status` ENUM('waiting_for_request', 'waiting_for_confirmation', 'confirmed', 'lent', 'returned', 'overdue', 'completed', 'cancelled') NOT NULL DEFAULT 'waiting_for_request',
    `status_detail` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrow_images` (
    `id` VARCHAR(255) NOT NULL,
    `borrow_id` INTEGER NOT NULL,
    `image_path` VARCHAR(255) NOT NULL,
    `image_name` VARCHAR(255) NOT NULL,
    `image_size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrow_applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `borrow_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `reason` TEXT NOT NULL,
    `address_id` INTEGER NOT NULL,
    `phone_id` INTEGER NOT NULL,
    `duration_from` DATETIME(3) NOT NULL,
    `duration_to` DATETIME(3) NOT NULL,
    `decline_reason` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrow_application_status_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `borrow_application_id` INTEGER NOT NULL,
    `status` ENUM('request_submitted', 'confirmed', 'borrowed', 'returned', 'overdue', 'completed', 'cancelled') NOT NULL DEFAULT 'request_submitted',
    `status_detail` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `address_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `phone_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donation_status_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `donation_id` INTEGER NOT NULL,
    `status` ENUM('submitted', 'confirmed', 'completed', 'failed') NOT NULL DEFAULT 'submitted',
    `status_detail` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donation_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `donation_id` INTEGER NOT NULL,
    `image_path` VARCHAR(255) NOT NULL,
    `image_name` VARCHAR(255) NOT NULL,
    `image_size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recycles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `address_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `phone_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recycle_status_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recycle_id` INTEGER NOT NULL,
    `status` ENUM('submitted', 'confirmed', 'in_transit', 'picked_up', 'completed', 'cancelled') NOT NULL DEFAULT 'submitted',
    `status_detail` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recycle_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recycle_id` INTEGER NOT NULL,
    `image_path` VARCHAR(255) NOT NULL,
    `image_name` VARCHAR(255) NOT NULL,
    `image_size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recycle_locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `location_name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recycle_location_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recycle_location_id` INTEGER NOT NULL,
    `image_path` VARCHAR(255) NOT NULL,
    `image_name` VARCHAR(255) NOT NULL,
    `image_size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recycle_location_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recycle_location_id` INTEGER NOT NULL,
    `categories_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repairs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `item_weight` DOUBLE NOT NULL,
    `address_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `repair_type` ENUM('minor_repair', 'moderate_repair', 'major_repair') NOT NULL,
    `phone_id` INTEGER NOT NULL,
    `repair_location` ENUM('my_location', 'warehouse') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repair_status_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `repair_id` INTEGER NOT NULL,
    `status` ENUM('request_submitted', 'confirmed', 'in_transit', 'picked_up', 'under_repair', 'courier_return', 'returned', 'completed', 'cancelled') NOT NULL DEFAULT 'request_submitted',
    `status_detail` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repair_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `repair_id` INTEGER NOT NULL,
    `image_path` VARCHAR(255) NOT NULL,
    `image_name` VARCHAR(255) NOT NULL,
    `image_size` INTEGER NOT NULL,
    `image_type` ENUM('front_view', 'close_up_damage') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repair_prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `minor_repair` INTEGER NOT NULL,
    `moderate_repair` INTEGER NOT NULL,
    `major_repair` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `repair_prices_category_id_key`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repair_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `repair_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `order_id` VARCHAR(355) NOT NULL,
    `payment_type` ENUM('bank_transfer', 'e_wallet', 'qris') NOT NULL,
    `bank_code` VARCHAR(191) NULL,
    `va_number` VARCHAR(191) NULL,
    `ewallet_type` VARCHAR(191) NULL,
    `qris_url` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `admin_fee` INTEGER NOT NULL,
    `status` ENUM('pending', 'paid', 'expired', 'cancelled', 'failed') NOT NULL DEFAULT 'pending',
    `paid_at` DATETIME(3) NULL,
    `expired_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `repair_payments_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `logo_url` VARCHAR(191) NULL,

    UNIQUE INDEX `banks_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullname` VARCHAR(255) NULL,
    `username` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `email_verified_at` DATETIME(3) NULL,
    `profile_picture` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `number` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `address_name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `city` VARCHAR(255) NULL,
    `state` VARCHAR(255) NULL,
    `country` VARCHAR(255) NOT NULL,
    `country_code` VARCHAR(255) NOT NULL,
    `zipcode` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `verification_code` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `verified_at` DATETIME(3) NULL,
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_oauth_providers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `provider` VARCHAR(255) NOT NULL,
    `provider_id` VARCHAR(255) NOT NULL,
    `provider_email` VARCHAR(255) NOT NULL,
    `provider_data` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_oauth_providers_user_id_provider_key`(`user_id`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_resets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `otp` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `barters` ADD CONSTRAINT `barters_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barters` ADD CONSTRAINT `barters_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barters` ADD CONSTRAINT `barters_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barters` ADD CONSTRAINT `barters_phone_id_fkey` FOREIGN KEY (`phone_id`) REFERENCES `phones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_status_histories` ADD CONSTRAINT `barter_status_histories_barter_id_fkey` FOREIGN KEY (`barter_id`) REFERENCES `barters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_status_histories` ADD CONSTRAINT `barter_status_histories_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_images` ADD CONSTRAINT `barter_images_barter_id_fkey` FOREIGN KEY (`barter_id`) REFERENCES `barters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_applications` ADD CONSTRAINT `barter_applications_barter_id_fkey` FOREIGN KEY (`barter_id`) REFERENCES `barters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_applications` ADD CONSTRAINT `barter_applications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_applications` ADD CONSTRAINT `barter_applications_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_applications` ADD CONSTRAINT `barter_applications_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_applications` ADD CONSTRAINT `barter_applications_phone_id_fkey` FOREIGN KEY (`phone_id`) REFERENCES `phones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_application_status_histories` ADD CONSTRAINT `barter_application_status_histories_barter_application_id_fkey` FOREIGN KEY (`barter_application_id`) REFERENCES `barter_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_application_status_histories` ADD CONSTRAINT `barter_application_status_histories_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barter_application_images` ADD CONSTRAINT `barter_application_images_barter_application_id_fkey` FOREIGN KEY (`barter_application_id`) REFERENCES `barter_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrows` ADD CONSTRAINT `borrows_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrows` ADD CONSTRAINT `borrows_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrows` ADD CONSTRAINT `borrows_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrows` ADD CONSTRAINT `borrows_phone_id_fkey` FOREIGN KEY (`phone_id`) REFERENCES `phones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_status_histories` ADD CONSTRAINT `borrow_status_histories_borrow_id_fkey` FOREIGN KEY (`borrow_id`) REFERENCES `borrows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_status_histories` ADD CONSTRAINT `borrow_status_histories_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_images` ADD CONSTRAINT `borrow_images_borrow_id_fkey` FOREIGN KEY (`borrow_id`) REFERENCES `borrows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_applications` ADD CONSTRAINT `borrow_applications_borrow_id_fkey` FOREIGN KEY (`borrow_id`) REFERENCES `borrows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_applications` ADD CONSTRAINT `borrow_applications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_applications` ADD CONSTRAINT `borrow_applications_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_applications` ADD CONSTRAINT `borrow_applications_phone_id_fkey` FOREIGN KEY (`phone_id`) REFERENCES `phones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_application_status_histories` ADD CONSTRAINT `borrow_application_status_histories_borrow_application_id_fkey` FOREIGN KEY (`borrow_application_id`) REFERENCES `borrow_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_application_status_histories` ADD CONSTRAINT `borrow_application_status_histories_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donations` ADD CONSTRAINT `donations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donations` ADD CONSTRAINT `donations_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donations` ADD CONSTRAINT `donations_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donations` ADD CONSTRAINT `donations_phone_id_fkey` FOREIGN KEY (`phone_id`) REFERENCES `phones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donation_status_histories` ADD CONSTRAINT `donation_status_histories_donation_id_fkey` FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donation_status_histories` ADD CONSTRAINT `donation_status_histories_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donation_images` ADD CONSTRAINT `donation_images_donation_id_fkey` FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recycles` ADD CONSTRAINT `recycles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recycles` ADD CONSTRAINT `recycles_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recycles` ADD CONSTRAINT `recycles_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recycles` ADD CONSTRAINT `recycles_phone_id_fkey` FOREIGN KEY (`phone_id`) REFERENCES `phones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recycle_status_histories` ADD CONSTRAINT `recycle_status_histories_recycle_id_fkey` FOREIGN KEY (`recycle_id`) REFERENCES `recycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recycle_status_histories` ADD CONSTRAINT `recycle_status_histories_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recycle_images` ADD CONSTRAINT `recycle_images_recycle_id_fkey` FOREIGN KEY (`recycle_id`) REFERENCES `recycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recycle_location_images` ADD CONSTRAINT `recycle_location_images_recycle_location_id_fkey` FOREIGN KEY (`recycle_location_id`) REFERENCES `recycle_locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recycle_location_categories` ADD CONSTRAINT `recycle_location_categories_recycle_location_id_fkey` FOREIGN KEY (`recycle_location_id`) REFERENCES `recycle_locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recycle_location_categories` ADD CONSTRAINT `recycle_location_categories_categories_id_fkey` FOREIGN KEY (`categories_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repairs` ADD CONSTRAINT `repairs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repairs` ADD CONSTRAINT `repairs_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repairs` ADD CONSTRAINT `repairs_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repairs` ADD CONSTRAINT `repairs_phone_id_fkey` FOREIGN KEY (`phone_id`) REFERENCES `phones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_status_histories` ADD CONSTRAINT `repair_status_histories_repair_id_fkey` FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_status_histories` ADD CONSTRAINT `repair_status_histories_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_images` ADD CONSTRAINT `repair_images_repair_id_fkey` FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_prices` ADD CONSTRAINT `repair_prices_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_payments` ADD CONSTRAINT `repair_payments_repair_id_fkey` FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_payments` ADD CONSTRAINT `repair_payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phones` ADD CONSTRAINT `phones_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_verifications` ADD CONSTRAINT `email_verifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_oauth_providers` ADD CONSTRAINT `user_oauth_providers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
