CREATE TABLE `insurers` (
	`id` varchar(36) NOT NULL,
	`company_name` varchar(150) NOT NULL,
	`contact_name` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(100) NOT NULL,
	`fixed_consultation_amount` decimal(10,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `medical_consultations` ADD `insurer_id` varchar(36);--> statement-breakpoint
ALTER TABLE `medical_consultations` ADD `agreed_amount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `patients` ADD `insurer_id` varchar(36);--> statement-breakpoint
ALTER TABLE `medical_consultations` ADD CONSTRAINT `medical_consultations_insurer_id_insurers_id_fk` FOREIGN KEY (`insurer_id`) REFERENCES `insurers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patients` ADD CONSTRAINT `patients_insurer_id_insurers_id_fk` FOREIGN KEY (`insurer_id`) REFERENCES `insurers`(`id`) ON DELETE set null ON UPDATE no action;