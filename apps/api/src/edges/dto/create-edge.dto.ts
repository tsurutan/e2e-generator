export interface CreateEdgeDto {
  fromUIStateId: string;
  toUIStateId: string;
  projectId: string;
  description: string;
  triggeredBy?: string;
  triggerType?: string;
}
