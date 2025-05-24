import {Inject, Query} from '@nestjs/common';
import {Input, Mutation, Router} from 'nestjs-trpc';
import {LabelsService} from 'src/labels/labels.service';
import {z} from 'zod';

@Router()
export class LabelsRouter {

    constructor(@Inject(LabelsService) private readonly labelsService: LabelsService) {
    }

    @Mutation({
        input: z.object({
            id: z.string().uuid(),
        }),
    })
    async deleteLabel(@Input('id') id: string): Promise<void> {
        await this.labelsService.deleteLabel(id);
    }
}
