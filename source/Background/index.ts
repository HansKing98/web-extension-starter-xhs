import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener((): void => {
  console.log('🦄 Loomi Hub extension installed');
});

// 定义消息类型
interface BackgroundMessageRequest {
  action: string;
  data?: any;
}

// 监听来自popup的消息
browser.runtime.onMessage.addListener((request: unknown, _sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  const typedRequest = request as BackgroundMessageRequest;
  if (typedRequest.action === 'logActivity') {
    console.log('Activity logged:', typedRequest.data);
    sendResponse({ success: true });
  }
  
  return true; // 保持消息通道开放
});

// 可选：监听标签页更新以提供更好的用户体验
browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});
