CREATE TABLE `api_client` (
	`id` char(30) NOT NULL,
	`time_created` timestamp(3) NOT NULL DEFAULT (now()),
	`time_updated` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`time_deleted` timestamp(3),
	`name` varchar(255) NOT NULL,
	`secret` varchar(255) NOT NULL,
	`redirect` varchar(255) NOT NULL,
	`user_id` char(30) NOT NULL,
	CONSTRAINT `api_client_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `api_client` ADD CONSTRAINT `api_client_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;