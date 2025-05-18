import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectWithFeatureCount } from './dto/project-with-feature-count.dto';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            feature: {
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return projects with feature counts in a single query', async () => {
      // Mock data
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          url: 'https://example.com',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            features: 5
          }
        },
        {
          id: '2',
          name: 'Project 2',
          url: 'https://example2.com',
          description: 'Description',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            features: 3
          }
        }
      ];

      // Mock the Prisma findMany method
      jest.spyOn(prismaService.project, 'findMany').mockResolvedValue(mockProjects);

      // Call the service method
      const result = await service.findAll();

      // Verify the result
      expect(result).toHaveLength(2);
      expect(result[0].featureCount).toBe(5);
      expect(result[1].featureCount).toBe(3);
      
      // Verify that Prisma was called with the correct parameters
      expect(prismaService.project.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              features: true
            }
          }
        }
      });

      // Verify that the feature count query was not called separately
      expect(prismaService.feature.count).not.toHaveBeenCalled();
    });
  });
});
