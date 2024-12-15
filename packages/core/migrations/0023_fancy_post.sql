ALTER TABLE `api_personal_token` MODIFY COLUMN `token` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `api_client` ADD `mode` enum('live','test');--> statement-breakpoint
ALTER TABLE `api_personal_token` ADD `mode` enum('live','test') NOT NULL;