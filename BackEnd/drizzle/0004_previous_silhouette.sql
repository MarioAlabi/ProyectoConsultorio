CREATE TABLE `appointments` (
	`id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`date` date NOT NULL,
	`time` varchar(10) NOT NULL,
	`reason` text,
	`status` enum('scheduled','present','cancelled','done') NOT NULL DEFAULT 'scheduled',
	`created_by_user_id` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;