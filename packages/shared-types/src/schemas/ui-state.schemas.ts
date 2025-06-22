import { z } from 'zod';

// 基本的なZodスキーマ
export const DOMSnapshotSchema = z.object({
  visibleElements: z.array(z.string()),
  hiddenElements: z.array(z.string()),
  formValues: z.record(z.string()),
  scrollPosition: z.object({
    x: z.number(),
    y: z.number(),
  }),
  activeElement: z.string(),
  newElements: z.array(z.string()).optional(),
  removedElements: z.array(z.string()).optional(),
  modifiedElements: z.array(z.object({
    selector: z.string(),
    changes: z.any(),
  })).optional(),
});

export const TriggerActionSchema = z.object({
  type: z.enum(['click', 'input', 'submit', 'hover', 'focus', 'blur', 'keydown', 'keyup']),
  element: z.string(),
  selector: z.string(),
  text: z.string().optional(),
  value: z.string().optional(),
  timestamp: z.string(),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  elementSize: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
});

export const UserIntentSchema = z.object({
  goal: z.string(),
  confidence: z.number(),
  category: z.enum(['authentication', 'navigation', 'data_entry', 'search', 'purchase', 'other']),
});

export const OperationGroupSchema = z.object({
  id: z.string(),
  operations: z.array(TriggerActionSchema),
  intent: UserIntentSchema,
  startTime: z.string(),
  endTime: z.string(),
  success: z.boolean(),
});

export const PerformanceMetricsSchema = z.object({
  domContentLoaded: z.number().optional(),
  loadComplete: z.number().optional(),
  firstContentfulPaint: z.number().optional(),
  largestContentfulPaint: z.number().optional(),
  cumulativeLayoutShift: z.number().optional(),
  firstInputDelay: z.number().optional(),
});

// UiState関連のスキーマ
export const UiStateBaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  pageUrl: z.string(),
  projectId: z.string(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUiStateRequestSchema = z.object({
  title: z.string().min(1).max(100),
  html: z.string().optional(),
  description: z.string().min(1),
  pageUrl: z.string().url(),
  projectId: z.string().uuid(),
  isDefault: z.boolean().optional(),
});

export const UpdateUiStateRequestSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).optional(),
  pageUrl: z.string().url().optional(),
  isDefault: z.boolean().optional(),
});

// OperationSession関連のスキーマ
export const CreateOperationSessionRequestSchema = z.object({
  projectId: z.string().uuid(),
  userGoal: z.string().optional(),
});

export const UpdateOperationSessionRequestSchema = z.object({
  endTime: z.date().optional(),
  status: z.enum(['active', 'completed', 'abandoned']).optional(),
  summary: z.any().optional(),
});

export const OperationSessionResponseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  userGoal: z.string().optional(),
  status: z.string(),
  summary: z.any().optional(),
  transitionCount: z.number().optional(),
});

// UIStateTransition関連のスキーマ
export const CreateUIStateTransitionRequestSchema = z.object({
  sessionId: z.string().uuid(),
  projectId: z.string().uuid(),
  fromUIStateId: z.string().uuid().optional(),
  toUIStateId: z.string().uuid(),
  triggerAction: TriggerActionSchema,
  beforeState: DOMSnapshotSchema,
  afterState: DOMSnapshotSchema,
  metadata: z.any().optional(),
});

export const UIStateTransitionResponseSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  projectId: z.string(),
  fromUIStateId: z.string().optional(),
  toUIStateId: z.string(),
  triggerAction: TriggerActionSchema,
  beforeState: DOMSnapshotSchema,
  afterState: DOMSnapshotSchema,
  metadata: z.any().optional(),
  timestamp: z.date(),
});

// 共通のクエリスキーマ
export const UuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const ProjectIdParamSchema = z.object({
  projectId: z.string().uuid(),
});

export const PageQuerySchema = z.object({
  projectId: z.string().uuid(),
  pageUrl: z.string().url(),
});
