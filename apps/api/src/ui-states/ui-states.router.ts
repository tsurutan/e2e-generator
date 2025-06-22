import { Inject } from '@nestjs/common';
import { Input, Mutation, Query, Router } from 'nestjs-trpc';
import { UiStatesService } from './ui-states.service';
import { z } from 'zod';
import { UiState } from '@prisma/client';

@Router()
export class UiStatesRouter {
  constructor(@Inject(UiStatesService) private readonly uiStatesService: UiStatesService) {}

  @Query({
    output: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })),
  })
  async findAll(): Promise<UiState[]> {
    return await this.uiStatesService.findAll();
  }

  @Query({
    input: z.object({
      projectId: z.string().uuid(),
    }),
    output: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })),
  })
  async findByProject(@Input('projectId') projectId: string): Promise<UiState[]> {
    return await this.uiStatesService.findByProject(projectId);
  }

  @Query({
    input: z.object({
      projectId: z.string().uuid(),
      pageUrl: z.string().url(),
    }),
    output: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })),
  })
  async findByPage(
    @Input('projectId') projectId: string,
    @Input('pageUrl') pageUrl: string
  ): Promise<UiState[]> {
    return await this.uiStatesService.findByPage(projectId, pageUrl);
  }

  @Query({
    input: z.object({
      id: z.string().uuid(),
    }),
    output: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  })
  async findOne(@Input('id') id: string): Promise<UiState> {
    return await this.uiStatesService.findOne(id);
  }

  @Mutation({
    input: z.object({
      title: z.string().min(1).max(100),
      html: z.string().optional(),
      description: z.string().min(1),
      pageUrl: z.string().url(),
      projectId: z.string().uuid(),
      isDefault: z.boolean().optional(),
    }),
    output: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
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
    input: z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(100).optional(),
      description: z.string().min(1).optional(),
      pageUrl: z.string().url().optional(),
      isDefault: z.boolean().optional(),
    }),
    output: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
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
    input: z.object({
      id: z.string().uuid(),
    }),
  })
  async remove(@Input('id') id: string): Promise<void> {
    await this.uiStatesService.remove(id);
  }

  @Query({
    input: z.object({
      projectId: z.string().uuid(),
      pageUrl: z.string().url(),
    }),
    output: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }).nullable(),
  })
  async getDefaultUiState(
    @Input('projectId') projectId: string,
    @Input('pageUrl') pageUrl: string
  ): Promise<UiState | null> {
    return await this.uiStatesService.getDefaultUiState(projectId, pageUrl);
  }
}
