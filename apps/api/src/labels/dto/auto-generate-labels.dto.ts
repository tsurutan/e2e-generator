export class AutoGenerateLabelsDto {
  /**
   * HTML content to analyze
   */
  htmlContent: string;

  /**
   * URL of the page
   */
  url: string;

  /**
   * Query parameters of the URL (optional)
   */
  queryParams?: string;

  /**
   * Project ID
   */
  projectId: string;
}
