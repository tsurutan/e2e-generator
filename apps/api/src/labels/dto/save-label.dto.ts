import { CreateLabelDto } from './create-label.dto';

export class SaveLabelDto {
  /**
   * 保存するラベル
   */
  label: CreateLabelDto;
}
