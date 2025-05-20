import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PersonaDto } from './dto/persona.dto';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonasService {
  private readonly logger = new Logger(PersonasService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * プロジェクトに関連するすべてのペルソナを取得する
   * @param projectId プロジェクトID
   * @returns ペルソナのリスト
   */
  async findAllByProjectId(projectId: string): Promise<PersonaDto[]> {
    this.logger.log(`プロジェクトID ${projectId} のペルソナを取得します`);
    
    // プロジェクトの存在確認
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`プロジェクトID ${projectId} が見つかりません`);
    }

    // ペルソナを取得
    const personas = await this.prisma.persona.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return personas;
  }

  /**
   * 指定されたIDのペルソナを取得する
   * @param id ペルソナID
   * @returns ペルソナ
   */
  async findOne(id: string): Promise<PersonaDto> {
    this.logger.log(`ペルソナID ${id} を取得します`);
    
    const persona = await this.prisma.persona.findUnique({
      where: { id },
    });

    if (!persona) {
      throw new NotFoundException(`ペルソナID ${id} が見つかりません`);
    }

    return persona;
  }

  /**
   * 新しいペルソナを作成する
   * @param createPersonaDto 作成するペルソナのデータ
   * @returns 作成されたペルソナ
   */
  async create(createPersonaDto: CreatePersonaDto): Promise<PersonaDto> {
    this.logger.log('新しいペルソナを作成します');
    
    // プロジェクトの存在確認
    const project = await this.prisma.project.findUnique({
      where: { id: createPersonaDto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`プロジェクトID ${createPersonaDto.projectId} が見つかりません`);
    }

    // ペルソナを作成
    const persona = await this.prisma.persona.create({
      data: createPersonaDto,
    });

    return persona;
  }

  /**
   * 指定されたIDのペルソナを更新する
   * @param id ペルソナID
   * @param updatePersonaDto 更新するペルソナのデータ
   * @returns 更新されたペルソナ
   */
  async update(id: string, updatePersonaDto: UpdatePersonaDto): Promise<PersonaDto> {
    this.logger.log(`ペルソナID ${id} を更新します`);
    
    // ペルソナの存在確認
    const existingPersona = await this.prisma.persona.findUnique({
      where: { id },
    });

    if (!existingPersona) {
      throw new NotFoundException(`ペルソナID ${id} が見つかりません`);
    }

    // ペルソナを更新
    const updatedPersona = await this.prisma.persona.update({
      where: { id },
      data: updatePersonaDto,
    });

    return updatedPersona;
  }

  /**
   * 指定されたIDのペルソナを削除する
   * @param id ペルソナID
   * @returns 削除されたペルソナ
   */
  async remove(id: string): Promise<PersonaDto> {
    this.logger.log(`ペルソナID ${id} を削除します`);
    
    // ペルソナの存在確認
    const existingPersona = await this.prisma.persona.findUnique({
      where: { id },
    });

    if (!existingPersona) {
      throw new NotFoundException(`ペルソナID ${id} が見つかりません`);
    }

    // ペルソナを削除
    const deletedPersona = await this.prisma.persona.delete({
      where: { id },
    });

    return deletedPersona;
  }
}
