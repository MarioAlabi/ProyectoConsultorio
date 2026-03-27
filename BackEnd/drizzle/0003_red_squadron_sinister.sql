CREATE TABLE `medical_consultations` (
	`id` varchar(36) NOT NULL,
	`preclinical_id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`doctor_id` varchar(36) NOT NULL,
	`anamnesis` text,
	`physical_exam` text,
	`diagnosis` text,
	`lab_results` text,
	`observations` text,
	`documents` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medical_consultations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prescribed_medications` (
	`id` varchar(36) NOT NULL,
	`consultation_id` varchar(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`concentration` varchar(50),
	`concentration_unit` varchar(20),
	`dose` varchar(50),
	`dose_unit` varchar(50),
	`route` varchar(50),
	`frequency` varchar(50),
	`duration` varchar(50),
	`additional_instructions` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `prescribed_medications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `patients` ADD `responsible_name` varchar(100);--> statement-breakpoint
ALTER TABLE `patients` ADD `personal_history` varchar(200);--> statement-breakpoint
ALTER TABLE `patients` ADD `family_history` varchar(200);--> statement-breakpoint
ALTER TABLE `preclinical_records` ADD `oxygen_saturation` int;--> statement-breakpoint
ALTER TABLE `medical_consultations` ADD CONSTRAINT `medical_consultations_preclinical_id_preclinical_records_id_fk` FOREIGN KEY (`preclinical_id`) REFERENCES `preclinical_records`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_consultations` ADD CONSTRAINT `medical_consultations_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_consultations` ADD CONSTRAINT `medical_consultations_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prescribed_medications` ADD CONSTRAINT `prescribed_medications_consultation_id_medical_consultations_id_fk` FOREIGN KEY (`consultation_id`) REFERENCES `medical_consultations`(`id`) ON DELETE cascade ON UPDATE no action;