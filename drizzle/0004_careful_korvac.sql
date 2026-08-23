CREATE TABLE `innovationInitiatives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` enum('ia_robotica','agrotech','food_automation','assistive_tech') NOT NULL,
	`status` enum('vision','diseno','prototipo','piloto') NOT NULL DEFAULT 'vision',
	`safetyScope` varchar(180) NOT NULL,
	`objective` text NOT NULL,
	`nextMilestone` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `innovationInitiatives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telemetrySources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`name` varchar(140) NOT NULL,
	`kind` enum('http_json','manual_payload') NOT NULL DEFAULT 'http_json',
	`endpointUrl` varchar(500) NOT NULL,
	`authMode` enum('none','bearer_placeholder') NOT NULL DEFAULT 'none',
	`credentialReference` varchar(140),
	`status` enum('preparada','conectada','bloqueada') NOT NULL DEFAULT 'preparada',
	`schemaJson` text NOT NULL,
	`lastCheckedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telemetrySources_id` PRIMARY KEY(`id`)
);
