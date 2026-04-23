ALTER TABLE `clinic_settings` ADD `address` varchar(100);--> statement-breakpoint
ALTER TABLE `insurers` ADD `status` varchar(20) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `dui` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `hiring_date` date;--> statement-breakpoint
ALTER TABLE `users` ADD `is_nurse` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `jvpm` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `jvpe` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_dui_unique` UNIQUE(`dui`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_jvpm_unique` UNIQUE(`jvpm`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_jvpe_unique` UNIQUE(`jvpe`);