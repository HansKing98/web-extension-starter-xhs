// https://www.typescriptlang.org/tsconfig/#noUncheckedSideEffectImports
declare module "*.scss" {}
declare module "*.css" {}

// 扩展webextension-polyfill的类型定义以支持新的API
declare global {
  // 在内容脚本中使用到的 chrome 全局对象（简化声明，避免 TS 报错）
  // 如需更完善的类型，可安装 @types/chrome 并引入对应类型
  const chrome: any;

  interface Browser {
    tabs: {
      query(queryInfo: any): Promise<any[]>;
      create(createProperties: any): Promise<any>;
      captureVisibleTab(windowId?: number, options?: any): Promise<string>;
    };
    scripting: {
      executeScript(injection: {
        target: { tabId: number };
        func: () => any;
      }): Promise<Array<{ result?: any }>>;
    };
  }
}