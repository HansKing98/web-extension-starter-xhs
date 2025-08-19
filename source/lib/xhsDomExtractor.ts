/**
 * 小红书页面DOM数据提取器
 * 从小红书笔记页面提取图片、评论、笔记内容和用户信息
 */



export interface XhsCommentData {
  id: string;
  author: {
    name: string;
    avatar: string;
    profileUrl: string;
    userId: string;
  };
  content: string;
  location: string;
  time: string;
  likes: number;
  replies: number;
  isAuthor?: boolean;
  parentCommentId?: string;
  images?: string[];
}

export interface XhsNoteContent {
  title: string;
  description: string;
  tags: string[];
  location: string;
  publishTime: string;
  postImage: string[];
}

export interface XhsUserInfo {
  name: string;
  avatar: string;
  profileUrl: string;
  userId: string;
}

export interface XhsNoteData {
  comments: XhsCommentData[];
  noteContent: XhsNoteContent;
  userInfo: XhsUserInfo;
  stats: {
    likes: number;
    collects: number;
    commentsCount: number;
  };
}

export class XhsDomExtractor {
  private container: Element;

  constructor(container: Element = document.body) {
    this.container = container;
  }



  /**
   * 提取所有评论数据
   */
  extractComments(): XhsCommentData[] {
    const comments: XhsCommentData[] = [];
    
    // 提取主评论
    const parentComments = this.container.querySelectorAll('.parent-comment .comment-item:not(.comment-item-sub)');
    
    parentComments.forEach(commentEl => {
      const comment = this.parseCommentElement(commentEl);
      if (comment) {
        comments.push(comment);
        
        // 提取子评论（回复）
        const subComments = commentEl.parentElement?.querySelectorAll('.comment-item-sub');
        subComments?.forEach(subCommentEl => {
          const subComment = this.parseCommentElement(subCommentEl, comment.id);
          if (subComment) {
            comments.push(subComment);
          }
        });
      }
    });

    return comments;
  }

  /**
   * 解析单个评论元素
   */
  private parseCommentElement(commentEl: Element, parentCommentId?: string): XhsCommentData | null {
    try {
      const id = commentEl.id?.replace('comment-', '') || '';
      
      // 提取用户信息
      const nameLink = commentEl.querySelector('.author .name');
      const avatarImg = commentEl.querySelector('.avatar img') as HTMLImageElement;
      const name = nameLink?.textContent?.trim() || '';
      const profileUrl = (nameLink as HTMLAnchorElement)?.href || '';
      const userId = nameLink?.getAttribute('data-user-id') || '';
      const avatar = avatarImg?.src || '';

      // 提取评论内容
      const contentEl = commentEl.querySelector('.content .note-text');
      const content = contentEl?.textContent?.trim() || '';

      // 提取时间和地点
      const dateEl = commentEl.querySelector('.date span:first-child');
      const locationEl = commentEl.querySelector('.date .location');
      const time = dateEl?.textContent?.trim() || '';
      const location = locationEl?.textContent?.trim() || '';

      // 提取点赞和回复数
      const likeCountEl = commentEl.querySelector('.like .count');
      const replyCountEl = commentEl.querySelector('.reply .count');
      const likes = this.parseCount(likeCountEl?.textContent?.trim());
      const replies = this.parseCount(replyCountEl?.textContent?.trim());

      // 检查是否为作者评论
      const isAuthor = !!commentEl.querySelector('.tag');

      // 提取评论图片
      const commentImages: string[] = [];
      const imgEls = commentEl.querySelectorAll('.comment-picture img');
      imgEls.forEach(img => {
        if (img instanceof HTMLImageElement) {
          commentImages.push(img.src);
        }
      });

      return {
        id,
        author: {
          name,
          avatar,
          profileUrl,
          userId
        },
        content,
        location,
        time,
        likes,
        replies,
        isAuthor,
        parentCommentId,
        images: commentImages.length > 0 ? commentImages : undefined
      };
    } catch (error) {
      console.error('解析评论失败:', error);
      return null;
    }
  }

  /**
   * 提取笔记内容
   */
  extractNoteContent(): XhsNoteContent {
    // 提取标题
    const titleEl = this.container.querySelector('#detail-title, .title');
    const title = titleEl?.textContent?.trim() || '';

    // 提取描述和标签
    const descEl = this.container.querySelector('#detail-desc, .desc');
    let description = '';
    const tags: string[] = [];

    if (descEl) {
      // 提取纯文本内容
      const textNodes = descEl.querySelectorAll('.note-text span');
      textNodes.forEach(node => {
        const text = node.textContent?.trim() || '';
        if (text && !text.startsWith('#')) {
          description += text + ' ';
        }
      });
      
      // 提取标签
      const tagEls = descEl.querySelectorAll('.tag');
      tagEls.forEach(tagEl => {
        const tagText = tagEl.textContent?.trim() || '';
        if (tagText) {
          tags.push(tagText);
        }
      });
    }

    // 提取发布时间和地点
    const bottomEl = this.container.querySelector('.bottom-container .date');
    const dateLocation = bottomEl?.textContent?.trim() || '';
    const [publishTime, location] = dateLocation.split(' ').filter(Boolean);

    // 提取笔记图片列表（轮播图）
    const postImage: string[] = [];
    const noteImages = this.container.querySelectorAll('.note-slider-img, .swiper-slide img[data-xhs-img]');
    noteImages.forEach(img => {
      if (img instanceof HTMLImageElement && img.src) {
        postImage.push(img.src);
      }
    });

    return {
      title: title.trim(),
      description: description.trim(),
      tags,
      location: location || '',
      publishTime: publishTime || '',
      postImage
    };
  }

  /**
   * 提取笔记用户信息
   */
  extractUserInfo(): XhsUserInfo {
    // 从作者区域提取用户信息
    const authorEl = this.container.querySelector('.author-wrapper, .author-container .author-wrapper');
    
    const nameEl = authorEl?.querySelector('.name .username');
    // 明确从 author-wrapper 下的 avatar-item 获取作者头像
    const avatarEl = authorEl?.querySelector('.avatar .avatar-item') as HTMLImageElement;
    const profileLinkEl = authorEl?.querySelector('.name') as HTMLAnchorElement;

    const name = nameEl?.textContent?.trim() || '';
    const avatar = avatarEl?.src || '';
    const profileUrl = profileLinkEl?.href || '';
    
    // 从URL或data属性中提取用户ID
    let userId = '';
    const match = profileUrl.match(/\/user\/profile\/([^?]+)/);
    if (match && match[1]) {
      userId = match[1];
    }

    return {
      name,
      avatar,
      profileUrl,
      userId
    };
  }

  /**
   * 提取统计数据
   */
  extractStats(): { likes: number; collects: number; commentsCount: number } {
    const likeEl = this.container.querySelector('.engage-bar .like-wrapper .count, .buttons .like-wrapper .count');
    const collectEl = this.container.querySelector('.engage-bar .collect-wrapper .count, .buttons .collect-wrapper .count');
    const commentEl = this.container.querySelector('.engage-bar .chat-wrapper .count, .buttons .chat-wrapper .count, .comments-container .total');

    const likes = this.parseCount(likeEl?.textContent?.trim());
    const collects = this.parseCount(collectEl?.textContent?.trim());
    
    // 评论数可能包含"共 32 条评论"这样的文本
    let commentsCount = 0;
    const commentText = commentEl?.textContent?.trim() || '';
    const commentMatch = commentText.match(/(\d+)/);
    if (commentMatch && commentMatch[1]) {
      commentsCount = parseInt(commentMatch[1]);
    } else {
      commentsCount = this.parseCount(commentText);
    }

    return {
      likes,
      collects,
      commentsCount
    };
  }

  /**
   * 解析数字字符串（处理"赞"、"回复"等文字）
   */
  private parseCount(text?: string): number {
    if (!text) return 0;
    if (text === '赞' || text === '回复') return 0;
    const num = parseInt(text);
    return isNaN(num) ? 0 : num;
  }

  /**
   * 提取完整的笔记数据
   */
  extractAllData(): XhsNoteData {
    return {
      comments: this.extractComments(),
      noteContent: this.extractNoteContent(),
      userInfo: this.extractUserInfo(),
      stats: this.extractStats()
    };
  }

  /**
   * 将数据转换为JSON字符串
   */
  toJson(data?: XhsNoteData): string {
    const noteData = data || this.extractAllData();
    return JSON.stringify(noteData, null, 2);
  }
}

/**
 * 导出便捷函数
 */
export function extractXhsData(container?: Element): XhsNoteData {
  const extractor = new XhsDomExtractor(container);
  return extractor.extractAllData();
}

export function extractXhsDataAsJson(container?: Element): string {
  const extractor = new XhsDomExtractor(container);
  return extractor.toJson();
}
