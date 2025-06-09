import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {PagesRouter} from 'src/pages/pages.router';
import { PagesService } from './pages.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [ConfigModule],
    providers: [PagesService, PrismaService, PagesRouter],
    exports: [PagesService],
})
export class PagesModule {}
