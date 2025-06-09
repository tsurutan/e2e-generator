import {Inject, Query} from '@nestjs/common';
import {Input, Mutation, Router} from 'nestjs-trpc';
import {ProjectsService} from 'src/projects/projects.service';
import {z} from 'zod';

@Router()
export class ProjectsRouter {
    constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {
    }

    @Mutation({
        input: z.object({
            projectId: z.string().uuid(),
        }),
    })
    async generateAllResources(@Input('projectId') projectId: string): Promise<void> {
        await this.projectsService.generateAllResources(projectId);
    }
}
