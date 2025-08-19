console.log('Loomi Hub Content Script 已加载');

// 定义消息类型
interface MessageRequest {
  action: string;
  selector?: string;
}

// 监听来自popup的消息
(globalThis as any).chrome.runtime.onMessage.addListener((request: MessageRequest, _sender: any, sendResponse: (response: any) => void) => {
  if (request.action === 'getPageHTML') {
    try {
      // 获取完整的HTML
      const fullHTML = document.documentElement.outerHTML;
      
      // 获取特定的DOM元素（针对小红书）
      const noteContent = document.getElementsByClassName('note-content');
      const noteContentHTML = noteContent.length > 0 ? (noteContent[0] as HTMLElement).outerHTML : '';
      
      // 获取页面标题
      const pageTitle = document.title;
      
      // 获取页面URL
      const pageUrl = window.location.href;
      
      // 获取可见文本内容
      const bodyText = document.body.innerText;
      
      sendResponse({
        success: true,
        data: {
          fullHTML,
          noteContentHTML,
          pageTitle,
          pageUrl,
          bodyText,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('获取页面内容失败:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
  
  if (request.action === 'getSpecificDOM') {
    try {
      const selector = request.selector || 'body';
      const element = document.querySelector(selector);
      
      if (element) {
        sendResponse({
          success: true,
          data: {
            html: element.outerHTML,
            text: (element as HTMLElement).innerText || element.textContent || '',
            selector: selector
          }
        });
      } else {
        sendResponse({
          success: false,
          error: `未找到选择器 "${selector}" 对应的元素`
        });
      }
    } catch (error) {
      console.error('获取指定DOM失败:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
  
  // 必须返回true以保持消息通道开放
  return true;
});

export {};
