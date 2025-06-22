import { Inject } from '@nestjs/common';
import { Input, Mutation, Query, Router } from 'nestjs-trpc';
import { EdgesService } from './edges.service';
import { z } from 'zod';

@Router()
export class EdgesRouter {
  constructor(@Inject(EdgesService) private readonly edgesService: EdgesService) {}

  @Query({
    input: z.object({
      projectId: z.string().uuid(),
    }),
  })
  async getEdgesByProject(@Input('projectId') projectId: string) {
    return this.edgesService.findByProject(projectId);
  }

  @Query({
    input: z.object({
      id: z.string().uuid(),
    }),
  })
  async getEdge(@Input('id') id: string) {
    return this.edgesService.findOne(id);
  }

  @Query({
    input: z.object({
      uiStateId: z.string().uuid(),
    }),
  })
  async getEdgesByUIState(@Input('uiStateId') uiStateId: string) {
    return this.edgesService.findEdgesByUIState(uiStateId);
  }

  @Mutation({
    input: z.object({
      projectId: z.string().uuid(),
      fromUIStateId: z.string().uuid(),
      toUIStateId: z.string().uuid(),
      description: z.string(),
      triggeredBy: z.string().optional(),
      triggerType: z.string().optional(),
    }),
  })
  async createEdge(
    @Input('projectId') projectId: string,
    @Input('fromUIStateId') fromUIStateId: string,
    @Input('toUIStateId') toUIStateId: string,
    @Input('description') description: string,
    @Input('triggeredBy') triggeredBy?: string,
    @Input('triggerType') triggerType?: string,
  ) {
    return this.edgesService.create({
      projectId,
      fromUIStateId,
      toUIStateId,
      description,
      triggeredBy,
      triggerType,
    });
  }

  @Mutation({
    input: z.object({
      id: z.string().uuid(),
      fromUIStateId: z.string().uuid().optional(),
      toUIStateId: z.string().uuid().optional(),
      description: z.string().optional(),
      triggeredBy: z.string().optional(),
      triggerType: z.string().optional(),
    }),
  })
  async updateEdge(
    @Input('id') id: string,
    @Input('fromUIStateId') fromUIStateId?: string,
    @Input('toUIStateId') toUIStateId?: string,
    @Input('description') description?: string,
    @Input('triggeredBy') triggeredBy?: string,
    @Input('triggerType') triggerType?: string,
  ) {
    const updateData: any = {};
    if (fromUIStateId !== undefined) updateData.fromUIStateId = fromUIStateId;
    if (toUIStateId !== undefined) updateData.toUIStateId = toUIStateId;
    if (description !== undefined) updateData.description = description;
    if (triggeredBy !== undefined) updateData.triggeredBy = triggeredBy;
    if (triggerType !== undefined) updateData.triggerType = triggerType;

    return this.edgesService.update(id, updateData);
  }

  @Mutation({
    input: z.object({
      id: z.string().uuid(),
    }),
  })
  async deleteEdge(@Input('id') id: string): Promise<void> {
    await this.edgesService.remove(id);
  }
}
