import * as React from "react";
import browser from "webextension-polyfill";
const manifest = browser.runtime.getManifest();

function openWebPage(url: string): Promise<any> {
  return (browser as any).tabs.create({ url });
}

const Popup: React.FC = () => {
  const [currentUrl, setCurrentUrl] = React.useState<string>("");
  const [isXiaohongshu, setIsXiaohongshu] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<string>("");
  const [isCopyingHtml, setIsCopyingHtml] = React.useState<boolean>(false);
  const [isCopyingText, setIsCopyingText] = React.useState<boolean>(false);
  const [apiStatus, setApiStatus] = React.useState<string>("");
  const [debugInfo, setDebugInfo] = React.useState<any>(null);
  const [showDebug, setShowDebug] = React.useState<boolean>(false);

  React.useEffect(() => {
    // 获取当前标签页信息并检查权限
    const initializeExtension = async () => {
      try {
        const tabs = await (browser as any).tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.url) {
          setCurrentUrl(tabs[0].url);
          setIsXiaohongshu(tabs[0].url.includes("xiaohongshu.com"));

          // 详细检查权限状态
          const permissionStatus = await checkPermissions();
          console.log("权限检查结果:", permissionStatus);

          if (permissionStatus.hasAPI && permissionStatus.hasPermissions) {
            setApiStatus("");
          } else {
            const statusMessage = `⚠️ ${permissionStatus.reason}`;
            setApiStatus(statusMessage);
            console.warn("权限不足:", permissionStatus);
          }
        }
      } catch (error) {
        console.error("初始化失败:", error);
        setApiStatus("❌ 初始化失败");
      }
    };

    initializeExtension();
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // 检查权限状态
  const checkPermissions = async () => {
    try {
      // 检查基本的 scripting API 是否存在
      if (
        !(browser as any).scripting ||
        typeof (browser as any).scripting.executeScript !== "function"
      ) {
        return { hasAPI: false, hasPermissions: false, reason: "API不存在" };
      }

      // 检查是否有 scripting 权限
      const hasScriptingPermission = await browser.permissions.contains({
        permissions: ["scripting"],
      });

      // 检查当前标签页权限
      const tabs = await (browser as any).tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      if (!currentTab?.url) {
        return {
          hasAPI: true,
          hasPermissions: false,
          reason: "无法获取当前页面",
        };
      }

      // 检查是否有当前域名的权限
      let hasHostPermission = false;
      try {
        const url = new URL(currentTab.url);
        hasHostPermission = await browser.permissions.contains({
          origins: [`${url.protocol}//${url.host}/*`],
        });
      } catch (e) {
        console.log("权限检查失败:", e);
      }

      return {
        hasAPI: true,
        hasPermissions: hasScriptingPermission && hasHostPermission,
        reason: hasScriptingPermission
          ? hasHostPermission
            ? "权限正常"
            : "缺少网站权限"
          : "缺少脚本权限",
        currentUrl: currentTab.url,
      };
    } catch (error) {
      console.error("检查权限时出错:", error);
      return { hasAPI: false, hasPermissions: false, reason: "权限检查失败" };
    }
  };

  // 请求必要的权限
  const requestPermissions = async () => {
    try {
      const tabs = await (browser as any).tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      if (!currentTab?.url) {
        throw new Error("无法获取当前页面URL");
      }

      const url = new URL(currentTab.url);
      const origin = `${url.protocol}//${url.host}/*`;

      // 请求权限
      const granted = await browser.permissions.request({
        permissions: ["scripting"],
        origins: [origin],
      });

      if (granted) {
        setApiStatus("✅ 权限已获取，扩展功能正常");
        console.log("权限请求成功");
        return true;
      } else {
        setApiStatus("❌ 权限请求被拒绝");
        console.log("权限请求被拒绝");
        return false;
      }
    } catch (error) {
      console.error("请求权限失败:", error);
      setApiStatus("❌ 权限请求失败");
      return false;
    }
  };

  // 通用的脚本执行函数
  const executeScript = async (func: Function, args?: any[]) => {
    try {
      // 详细检查权限状态
      const permissionStatus = await checkPermissions();

      if (!permissionStatus.hasAPI) {
        throw new Error("当前浏览器不支持脚本注入功能");
      }

      if (!permissionStatus.hasPermissions) {
        // 尝试请求权限
        console.log("权限不足，尝试请求权限...");
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error(
            `权限不足：${permissionStatus.reason}。请在扩展设置中授予必要的权限。`
          );
        }
      }

      const tabs = await (browser as any).tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tabs[0]?.id) {
        throw new Error("无法获取当前标签页");
      }

      // 检查当前页面是否允许脚本注入
      const currentTab = tabs[0];
      if (
        currentTab.url &&
        (currentTab.url.startsWith("chrome://") ||
          currentTab.url.startsWith("chrome-extension://") ||
          currentTab.url.startsWith("moz-extension://") ||
          currentTab.url.startsWith("edge://") ||
          currentTab.url.startsWith("about:") ||
          currentTab.url.includes("chrome.google.com/webstore"))
      ) {
        throw new Error(
          "无法在此类型的页面上运行脚本（浏览器系统页面或扩展商店）"
        );
      }

      const scriptOptions: any = {
        target: { tabId: currentTab.id },
        func: func,
      };

      if (args && args.length > 0) {
        scriptOptions.args = args;
      }

      console.log(
        "正在执行脚本，目标标签页:",
        currentTab.id,
        "当前URL:",
        currentTab.url
      );

      const results = await (browser as any).scripting.executeScript(
        scriptOptions
      );

      if (results && results[0]) {
        return results[0].result;
      } else {
        throw new Error("脚本执行失败：没有返回结果");
      }
    } catch (err) {
      console.error("脚本执行错误:", err);

      // 更详细的错误处理
      if (err instanceof Error) {
        if (err.message.includes("Cannot read properties of undefined")) {
          throw new Error("浏览器扩展API不可用，请刷新页面后重试");
        } else if (err.message.includes("Cannot access")) {
          throw new Error("无法访问此页面，可能是受保护的页面");
        } else if (err.message.includes("Missing host permission")) {
          throw new Error("缺少访问此网站的权限");
        } else if (
          err.message.includes("The extensions gallery cannot be scripted")
        ) {
          throw new Error("无法在扩展商店页面运行脚本");
        } else if (err.message.includes("Cannot access a chrome://")) {
          throw new Error("无法在浏览器系统页面运行脚本");
        }
      }

      throw err;
    }
  };

  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      showMessage("✅ URL已复制到剪贴板！");
    } catch (err) {
      console.error("复制URL失败:", err);
      showMessage("❌ 复制URL失败");
    }
  };

  // 使用 Content Script 作为降级方案
  const executeWithContentScript = async (action: string, data?: any) => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs[0]?.id) {
        throw new Error("无法获取当前标签页");
      }

      const response = await browser.tabs.sendMessage(tabs[0].id, { action, ...data });
      
      if (response && (response as any).success) {
        return response;
      } else {
        throw new Error((response as any)?.error || "内容脚本执行失败");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Could not establish connection")) {
        throw new Error("无法连接到内容脚本，请刷新页面后重试");
      }
      throw error;
    }
  };

  const copyCurrentHtml = async () => {
    setIsCopyingHtml(true);
    try {
      let result;

      // 首先尝试使用 scripting API
      try {
        result = await executeScript(() => {
          // 获取完整的HTML
          const fullHTML = document.documentElement.outerHTML;

          // 获取特定的DOM元素（针对小红书）
          const noteContent = document.getElementsByClassName("note-content");
          const noteContentHTML =
            noteContent.length > 0
              ? (noteContent[0] as HTMLElement).outerHTML
              : "";

          // 获取页面标题
          const pageTitle = document.title;

          // 获取页面URL
          const pageUrl = window.location.href;

          return {
            success: true,
            data: {
              fullHTML,
              noteContentHTML,
              pageTitle,
              pageUrl,
              timestamp: new Date().toISOString(),
            },
          };
        });
      } catch (scriptError) {
        console.log("scripting API 失败，尝试 content script:", scriptError);
        // 如果 scripting API 失败，使用 content script 作为降级方案
        result = await executeWithContentScript("getPageHTML");
      }

      if (result && result.success) {
        const { fullHTML, noteContentHTML, pageTitle } = result.data;

        // 优先复制小红书的note-content，如果没有则复制完整HTML
        const htmlToCopy = noteContentHTML || fullHTML;

        // 创建一个格式化的HTML字符串
        const formattedHtml = `<!-- 页面标题: ${pageTitle} -->
<!-- 页面URL: ${currentUrl} -->
<!-- 获取时间: ${new Date().toLocaleString()} -->

${htmlToCopy}`;

        await navigator.clipboard.writeText(formattedHtml);

        const elementType = noteContentHTML
          ? "note-content内容"
          : "完整页面HTML";
        showMessage(`✅ ${elementType}已复制到剪贴板！`);
      } else {
        throw new Error("获取页面内容失败");
      }
    } catch (err) {
      console.error("复制HTML失败:", err);
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      showMessage("❌ 复制HTML失败: " + errorMessage);
    } finally {
      setIsCopyingHtml(false);
    }
  };

  const copyPageText = async () => {
    setIsCopyingText(true);
    try {
      let result;

      // 首先尝试使用 scripting API
      try {
        result = await executeScript(() => {
          // 获取页面标题
          const pageTitle = document.title;

          // 获取可见文本内容
          const bodyText =
            document.body.innerText || document.body.textContent || "";

          return {
            success: true,
            data: {
              bodyText,
              pageTitle,
              timestamp: new Date().toISOString(),
            },
          };
        });
      } catch (scriptError) {
        console.log("scripting API 失败，尝试 content script:", scriptError);
        // 如果 scripting API 失败，使用 content script 作为降级方案
        result = await executeWithContentScript("getPageHTML");
      }

      if (result && result.success) {
        const { bodyText, pageTitle } = result.data;

        // 创建一个格式化的文本字符串
        const formattedText = `页面标题: ${pageTitle}
页面URL: ${currentUrl}
获取时间: ${new Date().toLocaleString()}

==== 页面内容 ====
${bodyText}`;

        await navigator.clipboard.writeText(formattedText);
        showMessage("✅ 页面文本已复制到剪贴板！");
      } else {
        throw new Error("获取页面内容失败");
      }
    } catch (err) {
      console.error("复制文本失败:", err);
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      showMessage("❌ 复制文本失败: " + errorMessage);
    } finally {
      setIsCopyingText(false);
    }
  };

  const copySpecificDOM = async (selector: string, description: string) => {
    try {
      let result;

      // 首先尝试使用 scripting API
      try {
        result = await executeScript(
          (selectorParam: string) => {
            const element = document.querySelector(selectorParam);

            if (element) {
              const html = element.outerHTML;
              const text =
                (element as HTMLElement).innerText || element.textContent || "";

              return {
                success: true,
                data: {
                  html,
                  text,
                  selector: selectorParam,
                },
              };
            } else {
              return {
                success: false,
                error: `未找到选择器 "${selectorParam}" 对应的元素`,
              };
            }
          },
          [selector]
        );
      } catch (scriptError) {
        console.log("scripting API 失败，尝试 content script:", scriptError);
        // 如果 scripting API 失败，使用 content script 作为降级方案
        result = await executeWithContentScript("getSpecificDOM", { selector });
      }

      if (result && result.success) {
        const { text } = result.data;

        // 创建一个格式化的内容字符串
        const formattedContent = `<!-- ${description} -->
${text}`;

        await navigator.clipboard.writeText(formattedContent);
        showMessage(`✅ ${description}已复制到剪贴板！`);
      } else {
        throw new Error(result?.error || "获取DOM失败");
      }
    } catch (err) {
      console.error("复制DOM失败:", err);
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      showMessage("❌ 复制DOM失败: " + errorMessage);
    }
  };

  const takeScreenshot = async () => {
    try {
      const tabs = await (browser as any).tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.id) {
        const dataUrl = await (browser as any).tabs.captureVisibleTab(
          undefined,
          {
            format: "png",
            quality: 100,
          }
        );

        // 将截图数据URL复制到剪贴板
        const response = await fetch(dataUrl);
        const blob = await response.blob();

        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);

        showMessage("✅ 截图已复制到剪贴板！");
      }
    } catch (err) {
      console.error("截图失败:", err);
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      showMessage("❌ 截图失败: " + errorMessage);
    }
  };

  // 检查内容脚本连接状态
  const checkContentScriptConnection = async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        return { connected: false, error: "无法获取当前标签页" };
      }

      // 发送一个简单的 ping 消息
      try {
        await browser.tabs.sendMessage(tabs[0].id, { action: "ping" });
        return { connected: true };
      } catch (error) {
        return { 
          connected: false, 
          error: error instanceof Error ? error.message : "连接失败",
          tabId: tabs[0].id,
          url: tabs[0].url
        };
      }
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : "检查连接失败" 
      };
    }
  };

  // 获取调试信息
  const getDebugInfo = async () => {
    try {
      // 首先检查连接状态
      const connectionStatus = await checkContentScriptConnection();
      
      if (!connectionStatus.connected) {
        console.error("内容脚本连接失败:", connectionStatus);
        
        let errorMsg = "❌ 无法连接到内容脚本";
        if (connectionStatus.error?.includes("Could not establish connection")) {
          errorMsg += "\n📝 请尝试：\n1. 刷新页面\n2. 重新加载扩展\n3. 确认在小红书页面上";
        } else if (connectionStatus.error?.includes("chrome://") || connectionStatus.error?.includes("extension://")) {
          errorMsg += "\n📝 无法在系统页面上运行";
        } else {
          errorMsg += `\n🔍 错误详情: ${connectionStatus.error}`;
        }
        
        showMessage(errorMsg);
        return;
      }

      let result;
      try {
        result = await executeWithContentScript("getDebugInfo");
      } catch (scriptError) {
        console.error("content script 获取调试信息失败:", scriptError);
        showMessage(`❌ 获取调试信息失败: ${scriptError instanceof Error ? scriptError.message : '未知错误'}`);
        return;
      }

      if (result && (result as any).success) {
        setDebugInfo((result as any).data);
        setShowDebug(true);
        showMessage("✅ 调试信息已获取");
      } else {
        throw new Error((result as any)?.error || "获取调试信息失败");
      }
    } catch (err) {
      console.error("获取调试信息失败:", err);
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      showMessage("❌ 获取调试信息失败: " + errorMessage);
    }
  };

  // 重新注入内容脚本
  const reinjectContentScript = async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        showMessage("❌ 无法获取当前标签页");
        return;
      }

      // 使用 scripting API 重新注入内容脚本
      await (browser as any).scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['assets/js/contentScript.bundle.js']
      });

      showMessage("✅ 内容脚本已重新注入，请稍等片刻再试");
    } catch (error) {
      console.error("重新注入失败:", error);
      showMessage(`❌ 重新注入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 手动触发按钮扫描
  const triggerButtonScan = async () => {
    try {
      // 首先检查连接
      const connectionStatus = await checkContentScriptConnection();
      if (!connectionStatus.connected) {
        showMessage("❌ 内容脚本未连接，请先检查连接状态");
        return;
      }

      let result;
      try {
        result = await executeWithContentScript("triggerButtonScan");
      } catch (scriptError) {
        console.log("content script 触发扫描失败:", scriptError);
        showMessage("❌ 无法触发按钮扫描");
        return;
      }

      if (result && (result as any).success) {
        const data = (result as any).data;
        showMessage(`✅ ${data.message} - 找到 ${data.followButtonsCount} 个关注按钮，已添加 ${data.loomiButtonsCount} 个Loomi按钮`);
        // 刷新调试信息
        if (showDebug) {
          setTimeout(getDebugInfo, 500);
        }
      } else {
        throw new Error((result as any)?.error || "触发扫描失败");
      }
    } catch (err) {
      console.error("触发按钮扫描失败:", err);
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      showMessage("❌ 触发扫描失败: " + errorMessage);
    }
  };

  return (
    <section className="popup-container">
      <h2 className="text-gradient text-3xl mb-6 text-center">
        Loomi Hub
        {/* {JSON.stringify(manifest.version)} */}
      </h2>

      {message && (
        <div
          className={
            message.includes("✅")
              ? "message-success mb-4"
              : "message-error mb-4"
          }
        >
          {message}
        </div>
      )}

      {apiStatus && (
        <div className="text-center text-sm mb-4 opacity-80">
          {apiStatus}
          {apiStatus.includes("权限") && apiStatus.includes("⚠️") && (
            <div className="mt-2">
              <button
                type="button"
                onClick={async () => {
                  const granted = await requestPermissions();
                  if (granted) {
                    // 重新检查权限状态
                    const permissionStatus = await checkPermissions();
                    if (
                      permissionStatus.hasAPI &&
                      permissionStatus.hasPermissions
                    ) {
                      setApiStatus("");
                    }
                  }
                }}
                className="btn-gradient text-xs px-3 py-1"
              >
                🔓 授予权限
              </button>
            </div>
          )}
        </div>
      )}

      {isXiaohongshu && (
        <div className="glass-panel mb-5">
          <h3 className="text-gradient-orange text-lg mb-4 text-center">
            小红书工具
          </h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={copyCurrentUrl}
              className="btn-gradient w-full"
            >
              📋 复制当前页面URL
            </button>
            <button
              type="button"
              onClick={copyCurrentHtml}
              className={`btn-gradient w-full ${
                isCopyingHtml ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isCopyingHtml}
            >
              {isCopyingHtml ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  正在复制...
                </span>
              ) : (
                "📄 复制页面HTML"
              )}
            </button>
            <button
              type="button"
              onClick={copyPageText}
              className={`btn-gradient w-full ${
                isCopyingText ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isCopyingText}
            >
              {isCopyingText ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  正在复制...
                </span>
              ) : (
                "📝 复制页面文本"
              )}
            </button>
            <button
              type="button"
              onClick={() => copySpecificDOM(".note-content", "小红书笔记内容")}
              className="btn-gradient w-full"
            >
              📋 复制笔记内容
            </button>
            <button
              type="button"
              onClick={takeScreenshot}
              className="btn-gradient w-full"
            >
              📸 截图并复制到剪贴板
            </button>
          </div>
        </div>
      )}

      {/* 调试信息面板 */}
      {showDebug && debugInfo && (
        <div className="glass-panel mb-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gradient-orange text-lg">调试信息</h3>
            <button
              type="button"
              onClick={() => setShowDebug(false)}
              className="text-red-500 hover:text-red-700"
            >
              ❌
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>🎯 关注按钮: {debugInfo.followButtonsCount}</div>
            <div>🚀 Loomi按钮: {debugInfo.loomiButtonsCount}</div>
            <div>📊 总按钮数: {debugInfo.totalButtonsCount}</div>
            <div>🔍 可能的关注按钮: {debugInfo.potentialFollowButtons}</div>
            <div>⏰ 更新时间: {new Date(debugInfo.timestamp).toLocaleTimeString()}</div>
            
            {debugInfo.followButtonsInfo.length > 0 && (
              <div className="mt-3">
                <h4 className="font-bold text-sm mb-2">找到的关注按钮:</h4>
                <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                  {debugInfo.followButtonsInfo.map((btn: any, index: number) => (
                    <div key={index} className="p-2 bg-gray-100 rounded text-black">
                      <div>类名: {btn.className}</div>
                      <div>文本: {btn.text || '无'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {debugInfo.potentialFollowButtonsInfo.length > 0 && (
              <div className="mt-3">
                <h4 className="font-bold text-sm mb-2">可能的关注按钮:</h4>
                <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                  {debugInfo.potentialFollowButtonsInfo.map((btn: any, index: number) => (
                    <div key={index} className="p-2 bg-blue-100 rounded text-black">
                      <div>类名: {btn.className}</div>
                      <div>文本: {btn.text || '无'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={getDebugInfo}
                className="btn-gradient w-full text-xs py-1"
              >
                🔄 刷新调试信息
              </button>
              <button
                type="button"
                onClick={triggerButtonScan}
                className="btn-gradient w-full text-xs py-1"
                style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' }}
              >
                🔍 重新扫描按钮
              </button>
            </div>
          </div>
        </div>
      )}

      {!isXiaohongshu && (
        <div className="glass-panel mb-5">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => openWebPage("https://xiaohongshu.com")}
              className="btn-gradient w-full"
            >
              仅限在 xiaohongshu.com 使用
            </button>
          </div>
        </div>
      )}

      {/* <button
        id="options__button"
        type="button"
        onClick={(): Promise<any> => {
          return openWebPage("/Options/options.html");
        }}
        style={{
          width: '100%',
          padding: '8px',
          marginTop: '10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        设置页面
      </button> */}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={(): Promise<any> => {
            return openWebPage("https://loomi.live");
          }}
          className="btn-link w-full"
        >
          🌐 访问 Loomi.live
        </button>
      </div>
    </section>
  );
};

export default Popup;
