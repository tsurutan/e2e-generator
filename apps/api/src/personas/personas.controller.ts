import { Controller, Get, Post, Body, Param, Put, Delete, Logger } from '@nestjs/common';
import { PersonasService } from './personas.service';
import { PersonaDto } from './dto/persona.dto';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Controller('personas')
export class PersonasController {
  private readonly logger = new Logger(PersonasController.name);

  constructor(private readonly personasService: PersonasService) {}

  /**
   * プロジェクトに関連するすべてのペルソナを取得するエンドポイント
   * @param projectId プロジェクトID
   * @returns ペルソナのリスト
   */
  @Get('project/:projectId')
  async findAllByProjectId(@Param('projectId') projectId: string): Promise<PersonaDto[]> {
    this.logger.log(`プロジェクトID ${projectId} のペルソナを取得するリクエストを受信しました`);
    return this.personasService.findAllByProjectId(projectId);
  }

  /**
   * 指定されたIDのペルソナを取得するエンドポイント
   * @param id ペルソナID
   * @returns ペルソナ
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PersonaDto> {
    this.logger.log(`ペルソナID ${id} を取得するリクエストを受信しました`);
    return this.personasService.findOne(id);
  }

  /**
   * 新しいペルソナを作成するエンドポイント
   * @param createPersonaDto 作成するペルソナのデータ
   * @returns 作成されたペルソナ
   */
  @Post()
  async create(@Body() createPersonaDto: CreatePersonaDto): Promise<PersonaDto> {
    this.logger.log('新しいペルソナを作成するリクエストを受信しました');
    return this.personasService.create(createPersonaDto);
  }

  /**
   * 指定されたIDのペルソナを更新するエンドポイント
   * @param id ペルソナID
   * @param updatePersonaDto 更新するペルソナのデータ
   * @returns 更新されたペルソナ
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePersonaDto: UpdatePersonaDto,
  ): Promise<PersonaDto> {
    this.logger.log(`ペルソナID ${id} を更新するリクエストを受信しました`);
    return this.personasService.update(id, updatePersonaDto);
  }

  /**
   * 指定されたIDのペルソナを削除するエンドポイント
   * @param id ペルソナID
   * @returns 削除されたペルソナ
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<PersonaDto> {
    this.logger.log(`ペルソナID ${id} を削除するリクエストを受信しました`);
    return this.personasService.remove(id);
  }
}
