CREATE TABLE `clinic_settings` (
	`id` int NOT NULL,
	`clinic_name` varchar(255) NOT NULL,
	`logo_url` longtext,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinic_settings_id` PRIMARY KEY(`id`)
);
