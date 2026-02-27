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
	`status` varchar(50) DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`),
	CONSTRAINT `patients_file_number_unique` UNIQUE(`file_number`)
);
