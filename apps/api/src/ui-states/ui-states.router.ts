import { Inject } from '@nestjs/common';
import { Input, Mutation, Query, Router } from 'nestjs-trpc';
import { UiStatesService } from './ui-states.service';
import { z } from 'zod';
import { UiState } from '@prisma/client';
import {
  UiStateBaseSchema,
  CreateUiStateRequestSchema,
  UpdateUiStateRequestSchema,
  UuidParamSchema,
  PageQuerySchema,
  ProjectIdParamSchema,
} from '@repo/shared-types';

@Router()
export class UiStatesRouter {
  constructor(@Inject(UiStatesService) private readonly uiStatesService: UiStatesService) {}

  @Query({
    output: z.array(UiStateBaseSchema),
  })
  async findAll(): Promise<UiState[]> {
    return await this.uiStatesService.findAll();
  }

  @Query({
    input: ProjectIdParamSchema,
    output: z.array(UiStateBaseSchema),
  })
  async findByProject(@Input('projectId') projectId: string): Promise<UiState[]> {
    return await this.uiStatesService.findByProject(projectId);
  }

  @Query({
    input: PageQuerySchema,
    output: z.array(UiStateBaseSchema),
  })
  async findByPage(
    @Input('projectId') projectId: string,
    @Input('pageUrl') pageUrl: string
  ): Promise<UiState[]> {
    return await this.uiStatesService.findByPage(projectId, pageUrl);
  }

  @Query({
    input: UuidParamSchema,
    output: UiStateBaseSchema,
  })
  async findOne(@Input('id') id: string): Promise<UiState> {
    return await this.uiStatesService.findOne(id);
  }

  @Mutation({
    input: CreateUiStateRequestSchema,
    output: UiStateBaseSchema,
  })
  async create(
    @Input('title') title: string,
    @Input('html') html: string,
    @Input('description') description: string,
    @Input('pageUrl') pageUrl: string,
    @Input('projectId') projectId: string,
    @Input('isDefault') isDefault?: boolean
  ): Promise<UiState> {
    return await this.uiStatesService.create({
      title,
      description,
      html,
      pageUrl,
      projectId,
      isDefault,
    });
  }

  @Mutation({
    input: UpdateUiStateRequestSchema,
    output: UiStateBaseSchema,
  })
  async update(
    @Input('id') id: string,
    @Input('title') title?: string,
    @Input('description') description?: string,
    @Input('pageUrl') pageUrl?: string,
    @Input('isDefault') isDefault?: boolean
  ): Promise<UiState> {
    return await this.uiStatesService.update(id, {
      title,
      description,
      pageUrl,
      isDefault,
    });
  }

  @Mutation({
    input: UuidParamSchema,
  })
  async remove(@Input('id') id: string): Promise<void> {
    await this.uiStatesService.remove(id);
  }

  @Query({
    input: PageQuerySchema,
    output: UiStateBaseSchema.nullable(),
  })
  async getDefaultUiState(
    @Input('projectId') projectId: string,
    @Input('pageUrl') pageUrl: string
  ): Promise<UiState | null> {
    return await this.uiStatesService.getDefaultUiState(projectId, pageUrl);
  }
}
