export interface EdgeDto {
  id: string;
  fromUIStateId: string;
  toUIStateId: string;
  projectId: string;
  description: string;
  triggeredBy?: string;
  triggerType?: string;
  createdAt: Date;
  updatedAt: Date;
}
