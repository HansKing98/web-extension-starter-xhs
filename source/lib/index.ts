/**
 * 小红书数据提取库
 * 提供从小红书页面DOM中提取各种数据的功能
 */

// 导出主要的提取器类和接口
export {
  XhsDomExtractor,
  extractXhsData,
  extractXhsDataAsJson,
  type XhsCommentData,
  type XhsNoteContent,
  type XhsUserInfo,
  type XhsNoteData
} from './xhsDomExtractor';

// 导出使用示例（可选）
export * from './xhsExtractorExample';
