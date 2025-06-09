import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {Page} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagesService {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService
    ) {
    }

    async savePage({ projectId, url}: { projectId: string, url: string }): Promise<Page> {
        return this.prisma.page.upsert({
            where: {
                projectId_url: {
                    projectId,
                    url,
                }
            },
            update: {
            },
            create: {
                projectId,
                url,
                // FIXME
                title: 'ホーム'
            },
        });
    }
}
