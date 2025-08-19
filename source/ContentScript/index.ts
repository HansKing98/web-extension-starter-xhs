console.log('🚀 Loomi Hub Content Script 已加载');
console.log('📍 当前页面URL:', window.location.href);
console.log('📄 页面标题:', document.title);

// 导入小红书数据提取库
import { extractXhsData } from '../lib/xhsDomExtractor';

// 定义消息类型
interface MessageRequest {
  action: string;
  selector?: string;
}

// 添加 loomi 按钮的样式
const LOOMI_BUTTON_STYLES = `
  .loomi-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    margin-left: 8px;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
    white-space: nowrap;
  }
  
  .loomi-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    filter: brightness(1.1);
  }
  
  .loomi-btn:active {
    transform: translateY(0);
  }
  
  .loomi-btn::before {
    content: "🚀";
    font-size: 12px;
  }
`;

// 注入样式
function injectStyles() {
  if (!document.getElementById('loomi-btn-styles')) {
    const style = document.createElement('style');
    style.id = 'loomi-btn-styles';
    style.textContent = LOOMI_BUTTON_STYLES;
    document.head.appendChild(style);
  }
}

// 创建 loomi 按钮
function createLoomiButton(): HTMLElement {
  const button = document.createElement('button');
  button.className = 'loomi-btn';
  button.textContent = 'Loomi一下';
  button.title = '使用 Loomi 分析此内容';

  // 添加点击事件
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // 检查是否为小红书页面
      const isXhsPage = window.location.hostname.includes('xiaohongshu.com') ||
        window.location.hostname.includes('xhscdn.com');

      let extractedData = null;

      if (isXhsPage) {
        // 如果是小红书页面，尝试提取数据
        try {
          extractedData = extractXhsData();
          console.log('🎉 成功提取小红书数据:', extractedData);

          // 生成简单的数据报告
          const report = {
            type: 'xiaohongshu',
            title: extractedData.noteContent.title,
            author: extractedData.userInfo.name,
            stats: extractedData.stats,
            postImagesCount: extractedData.noteContent.postImage.length,
            commentsCount: extractedData.comments.length,
            tags: extractedData.noteContent.tags
          };
          console.log('📊 数据报告:', report);

        } catch (error) {
          console.warn('⚠️ 小红书数据提取失败:', error);
          // 如果提取失败，回退到基本页面信息
          extractedData = null;
        }
      }

      // 获取基本页面信息
      const pageInfo = {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        isXhsPage,
        xhsData: extractedData
      };

      console.log('Loomi 按钮被点击', pageInfo);
      // 在这里 复制数据到剪贴板
      await navigator.clipboard.writeText(JSON.stringify(pageInfo));


      // 发送消息到 popup 或 background
      if ((globalThis as any).chrome?.runtime) {
        (globalThis as any).chrome.runtime.sendMessage({
          action: 'loomiButtonClicked',
          data: pageInfo
        }).catch(() => {
          // 忽略错误，可能是因为 popup 没有打开
        });
      }

      // 显示分析结果反馈
      if (extractedData) {
        button.textContent = '已提取数据';
        button.style.background = 'linear-gradient(135deg, #51a351 0%, #8cc152 100%)';
      } else {
        button.textContent = '已分析';
        button.style.background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
      }

      setTimeout(() => {
        button.textContent = 'Loomi';
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }, 3000);

    } catch (error) {
      console.error('❌ Loomi 按钮处理失败:', error);
      button.textContent = '处理失败';
      button.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';

      setTimeout(() => {
        button.textContent = 'Loomi';
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }, 2000);
    }
  });

  return button;
}

// 为指定的关注按钮添加 loomi 按钮
function addLoomiButtonToFollowBtn(followBtn: Element) {
  // 检查是否已经添加过 loomi 按钮
  const existingLoomiBtn = followBtn.parentElement?.querySelector('.loomi-btn');
  if (existingLoomiBtn) {
    return;
  }

  // 创建并插入 loomi 按钮
  const loomiBtn = createLoomiButton();

  // 将 loomi 按钮插入到关注按钮的后面
  if (followBtn.parentElement) {
    followBtn.parentElement.insertBefore(loomiBtn, followBtn.nextSibling);
  }
}

// 查找并处理所有的关注按钮
function processFollowButtons() {
  console.log('🔍 开始查找关注按钮...');

  // 尝试多种可能的选择器
  const selectors = [
    '.note-detail-follow-btn',
    '[class*="follow"]',
    '[class*="Follow"]',
    'button[class*="follow"]',
    'button[class*="Follow"]'
  ];

  let totalFound = 0;

  selectors.forEach(selector => {
    const buttons = document.querySelectorAll(selector);
    console.log(`🔎 选择器 "${selector}" 找到 ${buttons.length} 个元素`);

    if (buttons.length > 0) {
      buttons.forEach((btn, index) => {
        console.log(`  - 按钮 ${index + 1}:`, btn.className, btn.textContent?.trim());
      });
    }
  });

  const followButtons = document.querySelectorAll('.note-detail-follow-btn');
  totalFound = followButtons.length;

  if (totalFound === 0) {
    console.log('❌ 未找到 .note-detail-follow-btn 元素');
    console.log('🔍 尝试查找所有包含 "follow" 的按钮...');

    const allButtons = document.querySelectorAll('button');
    const followLikeButtons = Array.from(allButtons).filter(btn =>
      btn.className.toLowerCase().includes('follow') ||
      btn.textContent?.toLowerCase().includes('关注') ||
      btn.textContent?.toLowerCase().includes('follow')
    );

    console.log(`📋 找到 ${followLikeButtons.length} 个可能的关注按钮:`);
    followLikeButtons.forEach((btn, index) => {
      console.log(`  - 可能按钮 ${index + 1}:`, {
        className: btn.className,
        text: btn.textContent?.trim(),
        id: btn.id
      });
    });
  }

  followButtons.forEach((btn) => {
    addLoomiButtonToFollowBtn(btn);
  });

  console.log(`✅ 已处理 ${totalFound} 个关注按钮`);
}

// 创建调试面板
function createDebugPanel() {
  return false
  if (document.getElementById('loomi-debug-panel')) {
    return; // 已经存在
  }

  const panel = document.createElement('div');
  panel.id = 'loomi-debug-panel';
  panel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 300px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-height: 400px;
    overflow-y: auto;
  `;

  const title = document.createElement('div');
  title.style.cssText = 'font-weight: bold; margin-bottom: 10px; color: #667eea;';
  title.textContent = '🚀 Loomi Debug Panel';

  const info = document.createElement('div');
  info.id = 'loomi-debug-info';

  const controls = document.createElement('div');
  controls.style.cssText = 'margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;';

  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = '🔍 重新扫描';
  refreshBtn.style.cssText = 'padding: 5px 8px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;';
  refreshBtn.onclick = () => {
    processFollowButtons();
    updateDebugInfo();
  };

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '❌ 关闭';
  toggleBtn.style.cssText = 'padding: 5px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;';
  toggleBtn.onclick = () => {
    panel.remove();
  };

  const showAllBtn = document.createElement('button');
  showAllBtn.textContent = '📋 显示所有按钮';
  showAllBtn.style.cssText = 'padding: 5px 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;';
  showAllBtn.onclick = () => {
    showAllButtons();
  };

  controls.appendChild(refreshBtn);
  controls.appendChild(showAllBtn);
  controls.appendChild(toggleBtn);

  panel.appendChild(title);
  panel.appendChild(info);
  panel.appendChild(controls);

  document.body.appendChild(panel);

  // 初始更新信息
  updateDebugInfo();
}

// 更新调试信息
function updateDebugInfo() {
  const info = document.getElementById('loomi-debug-info');
  if (!info) return;

  const followButtons = document.querySelectorAll('.note-detail-follow-btn');
  const loomiButtons = document.querySelectorAll('.loomi-btn');
  const allButtons = document.querySelectorAll('button');

  info.innerHTML = `
    <div>📍 URL: ${window.location.href}</div>
    <div>🎯 找到关注按钮: ${followButtons.length}</div>
    <div>🚀 已添加Loomi按钮: ${loomiButtons.length}</div>
    <div>📊 页面总按钮数: ${allButtons.length}</div>
    <div>⏰ 更新时间: ${new Date().toLocaleTimeString()}</div>
  `;
}

// 显示所有按钮信息
function showAllButtons() {
  const allButtons = document.querySelectorAll('button');
  console.log(`📋 页面上的所有按钮 (共 ${allButtons.length} 个):`);

  allButtons.forEach((btn, index) => {
    console.log(`  按钮 ${index + 1}:`, {
      className: btn.className,
      id: btn.id,
      text: btn.textContent?.trim()?.substring(0, 50),
      tagName: btn.tagName,
      type: btn.type
    });
  });
}

// 初始化 loomi 按钮功能
function initLoomiButtons() {
  console.log('🚀 初始化 Loomi 按钮功能...');

  // 注入样式
  injectStyles();

  // 创建调试面板
  createDebugPanel();

  // 处理已存在的按钮
  processFollowButtons();

  // 设置 MutationObserver 来监听新添加的按钮
  const observer = new MutationObserver((mutations) => {
    let hasChanges = false;

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // 检查新添加的元素是否包含关注按钮
            const newFollowButtons = element.querySelectorAll('.note-detail-follow-btn');
            if (newFollowButtons.length > 0) {
              console.log(`🆕 检测到 ${newFollowButtons.length} 个新的关注按钮`);
              newFollowButtons.forEach((btn) => {
                addLoomiButtonToFollowBtn(btn);
              });
              hasChanges = true;
            }

            // 检查新添加的元素本身是否是关注按钮
            if (element.matches('.note-detail-follow-btn')) {
              console.log('🆕 检测到新的关注按钮元素');
              addLoomiButtonToFollowBtn(element);
              hasChanges = true;
            }
          }
        });
      }
    });

    // 如果有变化，更新调试信息
    if (hasChanges) {
      updateDebugInfo();
    }
  });

  // 开始监听整个文档的变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('✅ Loomi 按钮功能已初始化');

  // 定期检查（作为备用方案）
  setInterval(() => {
    const currentFollowButtons = document.querySelectorAll('.note-detail-follow-btn');
    const currentLoomiButtons = document.querySelectorAll('.loomi-btn');

    if (currentFollowButtons.length > currentLoomiButtons.length) {
      console.log('🔄 定期检查发现遗漏的按钮，重新处理...');
      processFollowButtons();
      updateDebugInfo();
    }
  }, 5000); // 每5秒检查一次
}

// 当页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initLoomiButtons();
    }, 1000);
  });
} else {
  setTimeout(() => {
    initLoomiButtons();
  }, 1000);
}

// 监听来自popup的消息
(globalThis as any).chrome.runtime.onMessage.addListener((request: MessageRequest, _sender: any, sendResponse: (response: any) => void) => {
  // 处理连接检查
  if (request.action === 'ping') {
    sendResponse({ success: true, message: 'pong' });
    return true;
  }

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

  // 新增：获取调试信息
  if (request.action === 'getDebugInfo') {
    try {
      const followButtons = document.querySelectorAll('.note-detail-follow-btn');
      const loomiButtons = document.querySelectorAll('.loomi-btn');
      const allButtons = document.querySelectorAll('button');

      // 查找包含 "follow" 或 "关注" 的按钮
      const potentialFollowButtons = Array.from(allButtons).filter(btn =>
        btn.className.toLowerCase().includes('follow') ||
        btn.textContent?.toLowerCase().includes('关注') ||
        btn.textContent?.toLowerCase().includes('follow')
      );

      sendResponse({
        success: true,
        data: {
          url: window.location.href,
          title: document.title,
          followButtonsCount: followButtons.length,
          loomiButtonsCount: loomiButtons.length,
          totalButtonsCount: allButtons.length,
          potentialFollowButtons: potentialFollowButtons.length,
          followButtonsInfo: Array.from(followButtons).map((btn, index) => ({
            index: index + 1,
            className: btn.className,
            text: btn.textContent?.trim(),
            id: btn.id
          })),
          potentialFollowButtonsInfo: potentialFollowButtons.map((btn, index) => ({
            index: index + 1,
            className: btn.className,
            text: btn.textContent?.trim(),
            id: btn.id
          })),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('获取调试信息失败:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 新增：手动触发按钮扫描
  if (request.action === 'triggerButtonScan') {
    try {
      console.log('🔄 手动触发按钮扫描...');
      processFollowButtons();
      updateDebugInfo();

      const followButtons = document.querySelectorAll('.note-detail-follow-btn');
      const loomiButtons = document.querySelectorAll('.loomi-btn');

      sendResponse({
        success: true,
        data: {
          message: '按钮扫描完成',
          followButtonsCount: followButtons.length,
          loomiButtonsCount: loomiButtons.length
        }
      });
    } catch (error) {
      console.error('手动扫描失败:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 必须返回true以保持消息通道开放
  return true;
});

export { };
