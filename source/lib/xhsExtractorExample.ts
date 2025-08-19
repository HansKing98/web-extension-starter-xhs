/**
 * 小红书DOM提取器使用示例
 */

import { XhsDomExtractor, extractXhsData, extractXhsDataAsJson } from './xhsDomExtractor';

// Chrome API类型定义（用于示例）
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (message: any, callback?: (response: any) => void) => void;
      };
    };
  }
}

/**
 * 基本使用示例
 */
export function basicUsageExample() {
  // 方法1: 使用便捷函数
  const data = extractXhsData();
  console.log('提取的数据:', data);

  // 方法2: 直接获取JSON字符串
  const jsonData = extractXhsDataAsJson();
  console.log('JSON数据:', jsonData);

  // 方法3: 使用类实例
  const extractor = new XhsDomExtractor();
  const allData = extractor.extractAllData();
  console.log('完整数据:', allData);
}

/**
 * 针对特定容器的提取示例
 */
export function specificContainerExample() {
  // 从特定的容器元素中提取数据
  const noteContainer = document.querySelector('#noteContainer');
  if (noteContainer) {
    const extractor = new XhsDomExtractor(noteContainer);
    
    // 分别提取各种数据
    const comments = extractor.extractComments();
    const noteContent = extractor.extractNoteContent();
    const userInfo = extractor.extractUserInfo();
    const stats = extractor.extractStats();

    console.log('评论数据:', comments);
    console.log('笔记内容:', noteContent);
    console.log('用户信息:', userInfo);
    console.log('统计数据:', stats);
  }
}

/**
 * 过滤和处理数据示例
 */
export function dataProcessingExample() {
  const extractor = new XhsDomExtractor();
  const data = extractor.extractAllData();
  
  // 获取笔记主图片
  const noteImages = data.noteContent.postImage;
  console.log('笔记主图片:', noteImages);

  // 获取作者头像
  const authorAvatar = data.userInfo.avatar;
  console.log('作者头像:', authorAvatar);

  // 获取作者的评论
  const authorComments = data.comments.filter(comment => comment.isAuthor);
  console.log('作者评论:', authorComments);

  // 获取有图片的评论
  const commentsWithImages = data.comments.filter(comment => comment.images && comment.images.length > 0);
  console.log('带图片的评论:', commentsWithImages);
}

/**
 * 实际应用示例：发送数据到后台
 */
export function sendDataToBackgroundExample() {
  try {
    // 提取数据
    const data = extractXhsData();
    
    // 发送到Chrome扩展的后台脚本
    if (typeof window !== 'undefined' && window.chrome?.runtime) {
      window.chrome.runtime.sendMessage({
        type: 'XHS_DATA_EXTRACTED',
        data: data
      }, (response: any) => {
        console.log('数据已发送到后台:', response);
      });
    }

    // 或者发送到服务器
    fetch('/api/xhs-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    }).then(response => {
      console.log('数据已发送到服务器:', response);
    }).catch(error => {
      console.error('发送失败:', error);
    });

  } catch (error) {
    console.error('提取数据失败:', error);
  }
}

/**
 * 监听DOM变化并自动提取数据
 */
export function autoExtractOnDomChange() {
  let isExtracting = false;
  
  const observer = new MutationObserver((mutations) => {
    if (isExtracting) return;
    
    // 检查是否有笔记容器出现
    const hasNoteContainer = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          return element.querySelector('#noteContainer') || element.id === 'noteContainer';
        }
        return false;
      });
    });

    if (hasNoteContainer) {
      isExtracting = true;
      
      // 延迟提取，确保DOM完全加载
      setTimeout(() => {
        try {
          const data = extractXhsData();
          console.log('自动提取的数据:', data);
          
          // 触发自定义事件
          const event = new CustomEvent('xhsDataExtracted', {
            detail: data
          });
          document.dispatchEvent(event);
          
        } catch (error) {
          console.error('自动提取失败:', error);
        } finally {
          isExtracting = false;
        }
      }, 1000);
    }
  });

  // 开始观察DOM变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 返回停止观察的函数
  return () => observer.disconnect();
}

/**
 * 格式化输出示例
 */
export function formatOutputExample() {
  const data = extractXhsData();
  
  // 生成数据报告
  const report = `
小红书笔记数据报告
==================

用户信息:
- 用户名: ${data.userInfo.name}
- 用户ID: ${data.userInfo.userId}

笔记内容:
- 标题: ${data.noteContent.title}
- 描述: ${data.noteContent.description}
- 标签: ${data.noteContent.tags.join(', ')}
- 发布时间: ${data.noteContent.publishTime}
- 发布地点: ${data.noteContent.location}

统计数据:
- 点赞数: ${data.stats.likes}
- 收藏数: ${data.stats.collects}
- 评论数: ${data.stats.commentsCount}

图片信息:
- 笔记图片: ${data.noteContent.postImage.length} 张
- 作者头像: ${data.userInfo.avatar ? '已获取' : '未获取'}

评论信息:
- 总评论数: ${data.comments.length}
- 作者回复: ${data.comments.filter(c => c.isAuthor).length}
- 带图评论: ${data.comments.filter(c => c.images && c.images.length > 0).length}
`;

  console.log(report);
  return report;
}
