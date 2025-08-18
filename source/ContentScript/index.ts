import browser from "webextension-polyfill";

console.log('helloworld from content script');

// 监听来自 Popup 或后台的消息，按需返回 DOM/HTML
browser.runtime.onMessage.addListener((request: any): Promise<any> | void => {
  if (request && request.action === 'getHTML') {
    const html = document.documentElement ? document.documentElement.outerHTML : '';
    return Promise.resolve({ html });
  }

  if (request && request.action === 'querySelector') {
    const selector: string = request.selector || '';
    let result = '';
    if (selector) {
      const el = document.querySelector(selector);
      result = el ? (el as HTMLElement).outerHTML : '';
    }
    return Promise.resolve({ html: result });
  }
});

export {};
