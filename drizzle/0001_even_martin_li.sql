CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`actorId` int,
	`eventType` varchar(100) NOT NULL,
	`severity` enum('info','atencion','critico') NOT NULL DEFAULT 'info',
	`message` text NOT NULL,
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`zoneId` int,
	`name` varchar(120) NOT NULL,
	`type` enum('sensor','actuador','camara','controlador','gateway') NOT NULL,
	`adapter` varchar(80) NOT NULL DEFAULT 'placeholder',
	`connectivity` enum('simulado','desconectado','preparado') NOT NULL DEFAULT 'simulado',
	`riskLevel` enum('bajo','medio','alto') NOT NULL DEFAULT 'bajo',
	`enabled` boolean NOT NULL DEFAULT false,
	`capabilitiesJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`hypothesis` text NOT NULL,
	`status` enum('borrador','activo','cerrado') NOT NULL DEFAULT 'borrador',
	`variablesJson` text,
	`notes` text,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrationAdapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`kind` enum('ros2','sensor','camara','controlador') NOT NULL,
	`endpointPlaceholder` varchar(255) NOT NULL,
	`credentialPlaceholder` varchar(120) NOT NULL,
	`permissionsJson` text NOT NULL,
	`status` enum('pendiente','bloqueado') NOT NULL DEFAULT 'bloqueado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationAdapters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(80) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(24) NOT NULL,
	`reorderPoint` decimal(10,2) NOT NULL DEFAULT '0.00',
	`location` varchar(120) NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`priority` enum('baja','media','alta') NOT NULL DEFAULT 'media',
	`status` enum('pendiente','en_progreso','hecha') NOT NULL DEFAULT 'pendiente',
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`location` varchar(180) NOT NULL,
	`mode` enum('observation','simulation') NOT NULL DEFAULT 'simulation',
	`safetyState` enum('nominal','attention','hold') NOT NULL DEFAULT 'nominal',
	`energyReservePct` decimal(5,2) NOT NULL DEFAULT '72.00',
	`energyThresholdPct` decimal(5,2) NOT NULL DEFAULT '25.00',
	`integrationNotice` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operationPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`objective` text NOT NULL,
	`mode` enum('observacion','simulacion') NOT NULL DEFAULT 'simulacion',
	`riskLevel` enum('bajo','medio','alto') NOT NULL DEFAULT 'bajo',
	`status` enum('borrador','pendiente_aprobacion','aprobado','bloqueado','completado') NOT NULL DEFAULT 'borrador',
	`preconditionsJson` text NOT NULL,
	`safeguardsJson` text NOT NULL,
	`approvalRequired` boolean NOT NULL DEFAULT true,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operationPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensorReadings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`metric` varchar(80) NOT NULL,
	`unit` varchar(24) NOT NULL,
	`value` decimal(10,3) NOT NULL,
	`thresholdLow` decimal(10,3),
	`thresholdHigh` decimal(10,3),
	`status` enum('normal','atencion','critico') NOT NULL DEFAULT 'normal',
	`source` enum('simulacion','adaptador') NOT NULL DEFAULT 'simulacion',
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sensorReadings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`code` varchar(24) NOT NULL,
	`type` enum('cultivo','germinacion','agua','energia','cuarentena') NOT NULL,
	`status` enum('normal','atencion','en_pausa') NOT NULL DEFAULT 'normal',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `zones_id` PRIMARY KEY(`id`)
);
