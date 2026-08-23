CREATE TABLE `simulationRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`createdBy` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`scenario` enum('riego','luz','nutrientes','energia') NOT NULL,
	`targetZone` varchar(120) NOT NULL,
	`durationHours` int NOT NULL,
	`assumptionsJson` text NOT NULL,
	`inputsJson` text NOT NULL,
	`resultsJson` text NOT NULL,
	`status` enum('completada','bloqueada') NOT NULL DEFAULT 'completada',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulationRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `operationPlans` ADD `decisionNote` text;