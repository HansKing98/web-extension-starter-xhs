import * as React from 'react';
import browser from "webextension-polyfill";

function openWebPage(url: string): Promise<any> {
  return (browser as any).tabs.create({url});
}

const Popup: React.FC = () => {
  const [currentUrl, setCurrentUrl] = React.useState<string>('');
  const [isXiaohongshu, setIsXiaohongshu] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<string>('');
  const [isCopyingHtml, setIsCopyingHtml] = React.useState<boolean>(false);

  React.useEffect(() => {
    // 获取当前标签页信息
    (browser as any).tabs.query({active: true, currentWindow: true}).then((tabs: any) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
        setIsXiaohongshu(tabs[0].url.includes('xiaohongshu.com'));
      }
    });
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      showMessage('✅ URL已复制到剪贴板！');
    } catch (err) {
      console.error('复制URL失败:', err);
      showMessage('❌ 复制URL失败');
    }
  };

  const copyCurrentHtml = async () => {
    console.log(
      "copyCurrentHtml",
      document.getElementsByClassName("note-content")
    );
    setIsCopyingHtml(true);
    try {
      debugger

    } catch (err) {
      console.error('复制HTML失败:', err);
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      showMessage('❌ 复制HTML失败: ' + errorMessage);
    } finally {
      setIsCopyingHtml(false);
    }
  };

  const takeScreenshot = async () => {
    try {
      const tabs = await (browser as any).tabs.query({active: true, currentWindow: true});
      if (tabs[0]?.id) {
        const dataUrl = await (browser as any).tabs.captureVisibleTab(undefined, {
          format: 'png',
          quality: 100
        });
        
        // 将截图数据URL复制到剪贴板
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        
        showMessage('✅ 截图已复制到剪贴板！');
      }
    } catch (err) {
      console.error('截图失败:', err);
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      showMessage('❌ 截图失败: ' + errorMessage);
    }
  };

  return (
    <section className="popup-container">
      <h2 className="text-gradient text-3xl mb-6 text-center">Loomi Hub</h2>

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
                "📄 复制当前页面HTML"
              )}
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

      {!isXiaohongshu && (
        <div className="non-xiaohongshu-message mb-4">
          请在 xiaohongshu.com 上使用此工具
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
