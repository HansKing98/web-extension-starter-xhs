# 小红书DOM数据提取库

这是一个用于从小红书页面DOM中提取数据的通用库，可以提取图片链接、评论数据、笔记内容和用户信息，并整理为JSON格式。

## 功能特性

- ✅ 提取所有评论数据（包括回复、用户信息、时间地点等）
- ✅ 提取笔记内容（标题、描述、标签、发布信息、图片列表）
- ✅ 提取笔记用户信息（用户名、头像、个人主页链接）
- ✅ 提取统计数据（点赞、收藏、评论数）
- ✅ 支持TypeScript类型定义
- ✅ 提供便捷函数和类实例两种使用方式

## 快速开始

### 基本使用

```typescript
import { extractXhsData, extractXhsDataAsJson } from './lib';

// 方法1: 获取完整数据对象
const data = extractXhsData();
console.log(data);

// 方法2: 直接获取JSON字符串
const jsonData = extractXhsDataAsJson();
console.log(jsonData);
```

### 使用类实例

```typescript
import { XhsDomExtractor } from './lib';

const extractor = new XhsDomExtractor();

// 分别提取各种数据
const comments = extractor.extractComments();
const noteContent = extractor.extractNoteContent();
const userInfo = extractor.extractUserInfo();
const stats = extractor.extractStats();

// 或者一次性提取所有数据
const allData = extractor.extractAllData();
```

### 针对特定容器

```typescript
import { XhsDomExtractor } from './lib';

// 从特定容器中提取数据
const noteContainer = document.querySelector('#noteContainer');
const extractor = new XhsDomExtractor(noteContainer);
const data = extractor.extractAllData();
```

## 数据结构

### XhsNoteData (完整数据)

```typescript
interface XhsNoteData {
  comments: XhsCommentData[];       // 所有评论
  noteContent: XhsNoteContent;      // 笔记内容
  userInfo: XhsUserInfo;            // 用户信息
  stats: {                          // 统计数据
    likes: number;                  // 点赞数
    collects: number;               // 收藏数
    commentsCount: number;          // 评论数
  };
}
```

### XhsCommentData (评论数据)

```typescript
interface XhsCommentData {
  id: string;                       // 评论ID
  author: {                         // 评论作者
    name: string;                   // 用户名
    avatar: string;                 // 头像URL
    profileUrl: string;             // 个人主页链接
    userId: string;                 // 用户ID
  };
  content: string;                  // 评论内容
  location: string;                 // 发布地点
  time: string;                     // 发布时间
  likes: number;                    // 点赞数
  replies: number;                  // 回复数
  isAuthor?: boolean;               // 是否为笔记作者的评论
  parentCommentId?: string;         // 父评论ID（用于回复）
  images?: string[];                // 评论中的图片
}
```

### XhsNoteContent (笔记内容)

```typescript
interface XhsNoteContent {
  title: string;                    // 笔记标题
  description: string;              // 笔记描述
  tags: string[];                   // 标签列表
  location: string;                 // 发布地点
  publishTime: string;              // 发布时间
  postImage: string[];              // 笔记图片列表
}
```

### XhsUserInfo (用户信息)

```typescript
interface XhsUserInfo {
  name: string;                     // 用户名
  avatar: string;                   // 头像URL
  profileUrl: string;               // 个人主页链接
  userId: string;                   // 用户ID
}
```

## 实际应用示例

### 在Chrome扩展中使用

```typescript
import { extractXhsData } from './lib';

// 在content script中使用
function extractAndSendData() {
  try {
    const data = extractXhsData();
    
    // 发送到后台脚本
    chrome.runtime.sendMessage({
      type: 'XHS_DATA_EXTRACTED',
      data: data
    });
  } catch (error) {
    console.error('提取数据失败:', error);
  }
}
```

### 自动监听DOM变化

```typescript
import { extractXhsData } from './lib';

function autoExtractOnPageLoad() {
  const observer = new MutationObserver((mutations) => {
    const hasNoteContainer = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          return element.querySelector('#noteContainer');
        }
        return false;
      });
    });

    if (hasNoteContainer) {
      setTimeout(() => {
        const data = extractXhsData();
        // 处理提取的数据
        console.log('提取到新的笔记数据:', data);
      }, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
```

### 数据过滤和处理

```typescript
import { XhsDomExtractor } from './lib';

const extractor = new XhsDomExtractor();
const data = extractor.extractAllData();

// 获取笔记主图片
const noteImages = data.noteContent.postImage;

// 获取作者头像
const authorAvatar = data.userInfo.avatar;

// 获取作者的评论
const authorComments = data.comments.filter(comment => comment.isAuthor);

// 获取带图片的评论
const commentsWithImages = data.comments.filter(comment => 
  comment.images && comment.images.length > 0
);
```

## 注意事项

1. **DOM结构依赖**: 该库基于当前小红书页面的DOM结构，如果页面结构发生变化，可能需要更新选择器。

2. **异步加载**: 小红书页面使用了大量的异步加载，建议在使用前确保页面完全加载完成。

3. **错误处理**: 库内部包含了基本的错误处理，但建议在使用时添加额外的try-catch保护。

4. **性能考虑**: 对于大量评论的页面，提取过程可能需要一些时间，建议在合适的时机调用。

## API参考

### 便捷函数

- `extractXhsData(container?: Element): XhsNoteData` - 提取完整数据
- `extractXhsDataAsJson(container?: Element): string` - 提取并转换为JSON字符串

### XhsDomExtractor类方法

- `extractComments(): XhsCommentData[]` - 提取所有评论
- `extractNoteContent(): XhsNoteContent` - 提取笔记内容
- `extractUserInfo(): XhsUserInfo` - 提取用户信息
- `extractStats()` - 提取统计数据
- `extractAllData(): XhsNoteData` - 提取所有数据
- `toJson(data?: XhsNoteData): string` - 转换为JSON字符串
