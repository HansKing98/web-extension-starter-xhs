import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener((): void => {
  console.log('🦄 Loomi Hub extension installed');
});

// 定义消息类型
interface BackgroundMessageRequest {
  action: string;
  data?: any;
}

// 监听来自popup和content script的消息
browser.runtime.onMessage.addListener((request: unknown, _sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  const typedRequest = request as BackgroundMessageRequest;
  
  if (typedRequest.action === 'logActivity') {
    console.log('Activity logged:', typedRequest.data);
    sendResponse({ success: true });
  }
  
  // 处理来自 loomi 按钮的点击事件
  if (typedRequest.action === 'loomiButtonClicked') {
    console.log('Loomi button clicked:', typedRequest.data);
    
    // 这里可以添加更多的处理逻辑，比如：
    // - 发送数据到 Loomi 服务器
    // - 保存分析记录到本地存储
    // - 通知其他组件
    
    // 可选：存储到本地存储
    browser.storage.local.get(['loomiAnalytics']).then((result) => {
      const analytics: any[] = (result.loomiAnalytics as any[]) || [];
      analytics.push({
        ...typedRequest.data,
        id: Date.now(),
        type: 'follow_button_analysis'
      });
      
      // 只保留最近100条记录
      if (analytics.length > 100) {
        analytics.splice(0, analytics.length - 100);
      }
      
      browser.storage.local.set({ loomiAnalytics: analytics });
    });
    
    sendResponse({ success: true, message: 'Loomi analysis completed' });
  }
  
  return true; // 保持消息通道开放
});

// 可选：监听标签页更新以提供更好的用户体验
browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});
