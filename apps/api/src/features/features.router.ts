import {Inject, Query} from '@nestjs/common';
import {Input, Mutation, Router} from 'nestjs-trpc';
import {FeaturesService} from 'src/features/features.service';
import {z} from 'zod';

@Router()
export class FeaturesRouter {

    constructor(@Inject(FeaturesService) private readonly featuresService: FeaturesService) {
    }

    @Mutation({
        input: z.object({
            id: z.string().uuid(),
        }),
    })
    async deleteLabel(@Input('id') id: string): Promise<void> {
        await this.featuresService.deleteFeature(id);
    }
}
