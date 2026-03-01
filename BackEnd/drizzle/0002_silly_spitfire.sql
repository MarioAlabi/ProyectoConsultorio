CREATE TABLE `preclinical_records` (
	`id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`created_by_user_id` varchar(36) NOT NULL,
	`created_by_role` varchar(20) NOT NULL,
	`motivo` text NOT NULL,
	`blood_pressure` varchar(20),
	`temperature` decimal(5,2),
	`weight` decimal(6,2),
	`height` decimal(4,2),
	`heart_rate` int,
	`bmi` decimal(5,2),
	`status` enum('waiting','in_consultation','done','cancelled') NOT NULL DEFAULT 'waiting',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `preclinical_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `preclinical_records` ADD CONSTRAINT `preclinical_records_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `preclinical_records` ADD CONSTRAINT `preclinical_records_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;