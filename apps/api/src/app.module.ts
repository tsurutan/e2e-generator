import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {TRPCModule} from 'nestjs-trpc';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {HelloModule} from './hello/hello.module';
import {ProjectsModule} from './projects/projects.module';
import {PrismaModule} from './prisma/prisma.module';
import {FeaturesModule} from './features/features.module';
import {LabelsModule} from './labels/labels.module';
import {ScenariosModule} from './scenarios/scenarios.module';
import {PersonasModule} from './personas/personas.module';
import * as path from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
                path.resolve(process.cwd(), '.env'),
            ],
        }),
        PrismaModule,
        HelloModule,
        ProjectsModule,
        FeaturesModule,
        LabelsModule,
        ScenariosModule,
        PersonasModule,
        TRPCModule.forRoot({
            autoSchemaFile: '../../packages/trpc/src/'
        })
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}
