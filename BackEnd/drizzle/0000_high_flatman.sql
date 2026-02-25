CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(100) NOT NULL,
	`provider_id` varchar(20) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`password` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limit` (
	`id` varchar(36) NOT NULL,
	`key` text NOT NULL,
	`count` int NOT NULL,
	`last_request` bigint NOT NULL,
	CONSTRAINT `rate_limit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token` varchar(128) NOT NULL,
	`expires_at` datetime NOT NULL,
	`ip_address` varchar(45),
	`user_agent` varchar(255),
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(80) NOT NULL,
	`email` varchar(100) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` varchar(255),
	`role` enum('admin','doctor','assistant') NOT NULL DEFAULT 'assistant',
	`username` varchar(30),
	`active` boolean DEFAULT true,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;