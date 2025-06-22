import { Prisma } from '@prisma/client';
import {
  DOMSnapshot,
  TriggerAction,
  UserIntent,
  OperationGroup,
  PerformanceMetrics,
  CreateOperationSessionRequest,
  UpdateOperationSessionRequest,
  CreateUIStateTransitionRequest,
  OperationSessionResponse,
  UIStateTransitionResponse,
} from '@repo/shared-types';

// Prismaから自動生成される型を使用
// export type OperationSession = Prisma.OperationSession
// export type UIStateTransition = Prisma.UIStateTransition

// 共通パッケージの型をAPIで使用するためのエイリアス
export type CreateOperationSessionDto = CreateOperationSessionRequest;
export type UpdateOperationSessionDto = Partial<Pick<Prisma.OperationSessionUpdateInput, 'endTime' | 'status' | 'summary'>>;
export type CreateUIStateTransitionDto = CreateUIStateTransitionRequest;
export type OperationSessionResponseDto = OperationSessionResponse;
export type UIStateTransitionResponseDto = UIStateTransitionResponse;

// 共通パッケージから再エクスポート
export {
  DOMSnapshot,
  TriggerAction,
  UserIntent,
  OperationGroup,
  PerformanceMetrics,
};
