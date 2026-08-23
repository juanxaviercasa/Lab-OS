CREATE TABLE `learningProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`ownerId` int NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`preferredLanguage` varchar(12) NOT NULL,
	`targetLanguage` varchar(12) NOT NULL,
	`proficiency` enum('inicial','intermedio','avanzado') NOT NULL DEFAULT 'inicial',
	`learningGoal` text NOT NULL,
	`pace` enum('pausado','constante','intensivo') NOT NULL DEFAULT 'constante',
	`privacyAcknowledged` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voicePracticeSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`profileId` int NOT NULL,
	`promptText` text NOT NULL,
	`transcript` text NOT NULL,
	`detectedLanguage` varchar(12),
	`status` enum('borrador','guardada') NOT NULL DEFAULT 'borrador',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voicePracticeSessions_id` PRIMARY KEY(`id`)
);
