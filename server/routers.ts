import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createExperiment,
  createInventoryItem,
  createLabTask,
  createLearningProfile,
  createOperationPlan,
  createSimulatedDevice,
  createSimulationRun,
  createTelemetrySource,
  getLabDashboard,
  getTelemetryHistory,
  markNotificationsRead,
  previewTelemetrySource,
  registerBlockedPhysicalAttempt,
  resolveOperationPlan,
  saveVoicePractice,
  transcribeVoiceAudio,
  updateLabConfiguration,
} from "./db";
import { physicalExecutionStatus, reviewSimulatedPlan } from "./labSafety";

const modeSchema = z.enum(["observacion", "simulacion"]);
const riskSchema = z.enum(["bajo", "medio", "alto"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  lab: router({
    dashboard: protectedProcedure.query(({ ctx }) => getLabDashboard(ctx.user.id)),
    telemetryHistory: protectedProcedure
      .input(z.object({ metric: z.string().optional(), periodHours: z.union([z.literal(24), z.literal(72), z.literal(168)]).optional() }).optional())
      .query(({ ctx, input }) => getTelemetryHistory(ctx.user.id, input?.metric, input?.periodHours ?? 24)),
    safetyStatus: protectedProcedure.query(() => physicalExecutionStatus()),
    recordBlockedPhysicalAttempt: protectedProcedure
      .input(z.object({ intent: z.string().min(3).max(500) }))
      .mutation(({ ctx, input }) => registerBlockedPhysicalAttempt(ctx.user.id, input.intent)),
    reviewPlan: protectedProcedure
      .input(z.object({ mode: modeSchema, riskLevel: riskSchema, preconditions: z.array(z.string()), safeguards: z.array(z.string()) }))
      .query(({ input }) => reviewSimulatedPlan(input)),
    configure: protectedProcedure
      .input(z.object({ name: z.string().min(3).max(120), location: z.string().min(3).max(180), energyThresholdPct: z.string().regex(/^\d+(\.\d{1,2})?$/), integrationNotice: z.string().min(8).max(1000) }))
      .mutation(({ ctx, input }) => updateLabConfiguration(ctx.user.id, input)),
    createTask: protectedProcedure
      .input(z.object({ title: z.string().min(3).max(180), description: z.string().max(1000).optional(), priority: z.enum(["baja", "media", "alta"]) }))
      .mutation(({ ctx, input }) => createLabTask(ctx.user.id, input)),
    createInventory: protectedProcedure
      .input(z.object({ name: z.string().min(2).max(160), category: z.string().min(2).max(80), quantity: z.string().regex(/^\d+(\.\d{1,2})?$/), unit: z.string().min(1).max(24), location: z.string().min(2).max(120), reorderPoint: z.string().regex(/^\d+(\.\d{1,2})?$/) }))
      .mutation(({ ctx, input }) => createInventoryItem(ctx.user.id, input)),
    createDevice: protectedProcedure
      .input(z.object({ name: z.string().min(2).max(120), type: z.enum(["sensor", "actuador", "camara", "controlador", "gateway"]), zoneId: z.number().int().positive().optional(), riskLevel: riskSchema, adapter: z.string().min(3).max(80) }))
      .mutation(({ ctx, input }) => createSimulatedDevice(ctx.user.id, input)),
    createExperiment: protectedProcedure
      .input(z.object({ title: z.string().min(3).max(180), hypothesis: z.string().min(10).max(2000), variables: z.array(z.string().min(1).max(80)).min(1).max(12) }))
      .mutation(({ ctx, input }) => createExperiment(ctx.user.id, input)),
    preparePlan: protectedProcedure
      .input(z.object({ title: z.string().min(3).max(180), objective: z.string().min(10).max(2000), mode: modeSchema, riskLevel: riskSchema, preconditions: z.array(z.string().min(1).max(300)).min(1).max(12), safeguards: z.array(z.string().min(1).max(300)).min(1).max(12) }))
      .mutation(async ({ ctx, input }) => {
        const review = reviewSimulatedPlan(input);
        if (!review.canBePrepared) {
          throw new TRPCError({ code: "BAD_REQUEST", message: review.missing.join(" ") });
        }
        await createOperationPlan(ctx.user.id, {
          ...input,
          approvalRequired: review.approvalRequired,
          status: review.approvalRequired ? "pendiente_aprobacion" : "borrador",
        });
        return review;
      }),
    resolvePlan: protectedProcedure
      .input(z.object({ planId: z.number().int().positive(), decision: z.enum(["aprobar", "rechazar"]), decisionNote: z.string().min(3).max(1000) }))
      .mutation(({ ctx, input }) => resolveOperationPlan(ctx.user.id, input.planId, input.decision, input.decisionNote)),
    runSimulation: protectedProcedure
      .input(z.object({ scenario: z.enum(["riego", "luz", "nutrientes", "energia"]), durationHours: z.number().int().min(1).max(72), targetZone: z.string().min(2).max(120) }))
      .mutation(({ ctx, input }) => createSimulationRun(ctx.user.id, input)),
    createTelemetrySource: protectedProcedure
      .input(z.object({ name: z.string().min(3).max(140), endpointUrl: z.string().url().max(500), authMode: z.enum(["none", "bearer_placeholder"]), credentialReference: z.string().max(140).optional() }))
      .mutation(({ ctx, input }) => createTelemetrySource(ctx.user.id, input)),
    previewTelemetrySource: protectedProcedure
      .input(z.object({ sourceId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => previewTelemetrySource(ctx.user.id, input.sourceId)),
    markNotificationsRead: protectedProcedure
      .input(z.object({ notificationIds: z.array(z.number().int().positive()).max(24).optional() }).optional())
      .mutation(({ ctx, input }) => markNotificationsRead(ctx.user.id, input?.notificationIds)),
    createLearningProfile: protectedProcedure
      .input(z.object({ displayName: z.string().min(2).max(120), preferredLanguage: z.string().min(2).max(12), targetLanguage: z.string().min(2).max(12), proficiency: z.enum(["inicial", "intermedio", "avanzado"]), learningGoal: z.string().min(8).max(1200), pace: z.enum(["pausado", "constante", "intensivo"]), privacyAcknowledged: z.literal(true) }))
      .mutation(({ ctx, input }) => createLearningProfile(ctx.user.id, input)),
    saveVoicePractice: protectedProcedure
      .input(z.object({ profileId: z.number().int().positive(), promptText: z.string().min(3).max(1000), transcript: z.string().min(1).max(5000), detectedLanguage: z.string().min(2).max(12).optional(), audioStorageKey: z.string().max(360).optional(), audioUrl: z.string().max(500).optional() }))
      .mutation(({ ctx, input }) => saveVoicePractice(ctx.user.id, input)),
    transcribeVoiceAudio: protectedProcedure
      .input(z.object({ profileId: z.number().int().positive(), promptText: z.string().min(3).max(1000), audioBase64: z.string().min(4).max(23_000_000), mimeType: z.string().regex(/^audio\/(webm|mpeg|wav|ogg|mp4)$/), language: z.string().min(2).max(12).optional() }))
      .mutation(({ ctx, input }) => transcribeVoiceAudio(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;
