CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`table_name` varchar(50) NOT NULL,
	`record_id` varchar(36) NOT NULL,
	`action` enum('CREATE','UPDATE','DELETE','STATUS_CHANGE') NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`user_name` varchar(80) NOT NULL,
	`user_role` varchar(20) NOT NULL,
	`previous_values` text,
	`new_values` text,
	`description` varchar(255),
	`ip_address` varchar(45),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;