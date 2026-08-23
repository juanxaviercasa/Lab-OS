CREATE TABLE `cleaningScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`area` enum('cocina','sala','exterior','residuos') NOT NULL,
	`taskType` enum('vajilla','superficies','encerado','vehiculo','residuos_reciclaje') NOT NULL,
	`riskLevel` enum('bajo','medio','alto') NOT NULL DEFAULT 'bajo',
	`metricsJson` text NOT NULL,
	`safeguardsJson` text NOT NULL,
	`verificationJson` text,
	`status` enum('borrador','evaluado','requiere_revision','bloqueado') NOT NULL DEFAULT 'borrador',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cleaningScenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinicalApprovalRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`templateId` int NOT NULL,
	`scenarioTitle` varchar(180) NOT NULL,
	`reviewerRole` varchar(100) NOT NULL,
	`reviewerName` varchar(160) NOT NULL,
	`evidenceJson` text NOT NULL,
	`consentConfirmed` boolean NOT NULL DEFAULT false,
	`decision` enum('pendiente','aprobada_simulacion','rechazada') NOT NULL DEFAULT 'pendiente',
	`decisionNote` text,
	`decidedBy` int,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clinicalApprovalRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinicalApprovalTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`scope` enum('movilidad','transferencia','alimentacion','comunicacion') NOT NULL,
	`version` varchar(24) NOT NULL DEFAULT '1.0',
	`status` enum('borrador','lista','archivada') NOT NULL DEFAULT 'borrador',
	`requiredRolesJson` text NOT NULL,
	`checklistJson` text NOT NULL,
	`consentStatement` text NOT NULL,
	`safetyBoundary` text NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinicalApprovalTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telemetrySourceChecks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`sourceId` int NOT NULL,
	`outcome` enum('success','http_error','schema_error','blocked','network_error') NOT NULL,
	`httpStatus` int,
	`readingCount` int NOT NULL DEFAULT 0,
	`summary` text NOT NULL,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telemetrySourceChecks_id` PRIMARY KEY(`id`)
);
