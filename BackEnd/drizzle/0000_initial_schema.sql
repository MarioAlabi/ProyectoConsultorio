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
CREATE TABLE `clinic_settings` (
	`id` int NOT NULL,
	`clinic_name` varchar(255) NOT NULL,
	`address` varchar(100),
	`logo_url` longtext,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinic_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` varchar(36) NOT NULL,
	`type` enum('constancia','incapacidad') NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` varchar(255),
	`body_template` text NOT NULL,
	`is_default` boolean NOT NULL DEFAULT false,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_by_user_id` varchar(36),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_documents` (
	`id` varchar(36) NOT NULL,
	`template_id` varchar(36),
	`type` enum('constancia','incapacidad') NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`consultation_id` varchar(36),
	`doctor_id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` longtext NOT NULL,
	`metadata` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `generated_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurers` (
	`id` varchar(36) NOT NULL,
	`company_name` varchar(150) NOT NULL,
	`contact_name` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(100) NOT NULL,
	`fixed_consultation_amount` decimal(10,2) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medical_consultations` (
	`id` varchar(36) NOT NULL,
	`preclinical_id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`insurer_id` varchar(36),
	`doctor_id` varchar(36) NOT NULL,
	`agreed_amount` decimal(10,2),
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
CREATE TABLE `patients` (
	`id` varchar(36) NOT NULL,
	`full_name` varchar(150) NOT NULL,
	`year_of_birth` date NOT NULL,
	`identity_document` varchar(20) NOT NULL,
	`gender` enum('male','female') NOT NULL,
	`phone` varchar(20),
	`address` text,
	`file_number` varchar(20) NOT NULL,
	`is_minor` int DEFAULT 0,
	`responsible_name` varchar(100),
	`personal_history` varchar(200),
	`family_history` varchar(200),
	`insurer_id` varchar(36),
	`status` varchar(50) DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`),
	CONSTRAINT `patients_file_number_unique` UNIQUE(`file_number`)
);
--> statement-breakpoint
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
	`oxygen_saturation` int,
	`bmi` decimal(5,2),
	`status` enum('waiting','in_consultation','done','cancelled') NOT NULL DEFAULT 'waiting',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `preclinical_records_id` PRIMARY KEY(`id`)
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
	`impersonated_by` varchar(36),
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
	`role` varchar(20) NOT NULL DEFAULT 'assistant',
	`banned` boolean NOT NULL DEFAULT false,
	`ban_reason` varchar(255),
	`ban_expires` datetime,
	`dui` varchar(10),
	`phone` varchar(20),
	`address` text,
	`hiring_date` date,
	`is_nurse` boolean DEFAULT false,
	`jvpm` varchar(20),
	`jvpe` varchar(20),
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_dui_unique` UNIQUE(`dui`),
	CONSTRAINT `users_jvpm_unique` UNIQUE(`jvpm`),
	CONSTRAINT `users_jvpe_unique` UNIQUE(`jvpe`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_templates` ADD CONSTRAINT `document_templates_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `generated_documents` ADD CONSTRAINT `generated_documents_template_id_document_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `document_templates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `generated_documents` ADD CONSTRAINT `generated_documents_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `generated_documents` ADD CONSTRAINT `generated_documents_consultation_id_medical_consultations_id_fk` FOREIGN KEY (`consultation_id`) REFERENCES `medical_consultations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `generated_documents` ADD CONSTRAINT `generated_documents_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_consultations` ADD CONSTRAINT `medical_consultations_preclinical_id_preclinical_records_id_fk` FOREIGN KEY (`preclinical_id`) REFERENCES `preclinical_records`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_consultations` ADD CONSTRAINT `medical_consultations_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_consultations` ADD CONSTRAINT `medical_consultations_insurer_id_insurers_id_fk` FOREIGN KEY (`insurer_id`) REFERENCES `insurers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_consultations` ADD CONSTRAINT `medical_consultations_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patients` ADD CONSTRAINT `patients_insurer_id_insurers_id_fk` FOREIGN KEY (`insurer_id`) REFERENCES `insurers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `preclinical_records` ADD CONSTRAINT `preclinical_records_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `preclinical_records` ADD CONSTRAINT `preclinical_records_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prescribed_medications` ADD CONSTRAINT `fk_prescribed_meds_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `medical_consultations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;