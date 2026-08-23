CREATE TABLE `labNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`kind` enum('telemetria','simulacion','seguridad','sistema') NOT NULL,
	`severity` enum('info','atencion','critico') NOT NULL DEFAULT 'info',
	`title` varchar(180) NOT NULL,
	`detail` text NOT NULL,
	`unread` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `labNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `robotLearningModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`initiativeSlug` varchar(80) NOT NULL,
	`name` varchar(160) NOT NULL,
	`capability` varchar(120) NOT NULL,
	`mode` enum('dialogo','simulacion','evaluacion','planificacion') NOT NULL,
	`readiness` enum('concepto','diseno','prototipo') NOT NULL DEFAULT 'concepto',
	`safetyBoundary` text NOT NULL,
	`progressPct` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `robotLearningModules_id` PRIMARY KEY(`id`)
);
