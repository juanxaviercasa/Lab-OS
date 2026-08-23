CREATE TABLE `kitchenScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`culture` varchar(100) NOT NULL,
	`durationMinutes` int NOT NULL,
	`ingredientsJson` text NOT NULL,
	`stagesJson` text NOT NULL,
	`riskLevel` enum('bajo','medio','alto') NOT NULL DEFAULT 'bajo',
	`safetyNotes` text NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kitchenScenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `voicePracticeSessions` ADD `audioStorageKey` varchar(360);--> statement-breakpoint
ALTER TABLE `voicePracticeSessions` ADD `audioUrl` varchar(500);