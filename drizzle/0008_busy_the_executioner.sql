CREATE TABLE `kitchenStations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`type` enum('despensa','preparacion','coccion','seguridad') NOT NULL,
	`status` enum('modelada','aislada','bloqueada','activa') NOT NULL,
	`description` text NOT NULL,
	`safetyMode` varchar(100) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kitchenStations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voiceProviderConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`provider` varchar(80) NOT NULL,
	`endpointPlaceholder` varchar(180) NOT NULL,
	`credentialPlaceholder` varchar(180) NOT NULL,
	`maxAudioMb` int NOT NULL DEFAULT 16,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `voiceProviderConfigs_id` PRIMARY KEY(`id`)
);
