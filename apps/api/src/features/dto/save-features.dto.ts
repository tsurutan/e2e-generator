import { FeatureDto } from './feature.dto';

export class SaveFeaturesDto {
  /**
   * 保存する機能のリスト
   */
  features: FeatureDto[];

  /**
   * 関連付けるプロジェクトのID
   */
  projectId: string;
}
