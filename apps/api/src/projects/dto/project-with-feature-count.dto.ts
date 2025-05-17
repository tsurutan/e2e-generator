import { Project } from '@prisma/client';

export interface ProjectWithFeatureCount extends Project {
  featureCount: number;
}
