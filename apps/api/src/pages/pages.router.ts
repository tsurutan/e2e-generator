import {Inject} from '@nestjs/common';
import {Input, Mutation, Router} from 'nestjs-trpc';
import {PagesService} from 'src/pages/pages.service';
import {z} from 'zod';

@Router()
export class PagesRouter {

    constructor(@Inject(PagesService) private readonly pagesService: PagesService) {
    }

    @Mutation({
        input: z.object({
            projectId: z.string().uuid(),
            url: z.string().url(),
        }),
    })
    async savePage(@Input('projectId') projectId: string, @Input('url') url: string): Promise<void> {
        await this.pagesService.savePage({
            projectId,
            url,
        });
    }
}
