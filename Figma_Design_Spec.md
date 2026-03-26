# Yangwan Portfolio Website - Figma Design Specification

## 文件链接
已创建的 Figma 文件: https://www.figma.com/design/wF9GjfkbMLEsFTttLQYHKS

## 设计系统

### 颜色规范
- **背景色**: #050505 (深黑)
- **主文字**: #FFFFFF (白色)
- **次要文字**: #B3B3B3 (灰色 70%)
- **强调色**: #FF8A00 (橙色)
- **卡片背景**: rgba(255, 255, 255, 0.03) 带 12px 模糊
- **边框**: rgba(255, 255, 255, 0.08)

### 字体系统
- **衬线字体**: Cormorant Garamond (用于大标题)
  - Bold: 700
  - Semibold: 600
  - Regular: 400
- **无衬线字体**: Inter (用于正文和导航)
  - Light: 300
  - Regular: 400
  - Medium: 500

### 字号规范
- 超大标题: 160px (Hero)
- H1: 112px
- H2: 48px
- H3: 32px
- H4: 24px
- 正文: 14px
- 小字: 11-12px
- 标签: 10px

### 间距系统
- 页面边距: 96px (桌面), 48px (移动)
- 区块间距: 96px
- 卡片内边距: 32px
- 元素间距: 8px, 16px, 24px, 32px, 48px

## 页面结构

### 1. 首页 (Homepage) - 1440x5700px

#### 导航栏 (固定顶部)
- 高度: 96px
- 背景: 黑色半透明 (opacity 0.3) + 背景模糊
- 左侧: "YANGWAN'S PORTFOLIO" (Inter Light, 11px, 字间距 20%)
- 右侧: ABOUT | WORKS | CONTACT (Inter Light, 10px, 间距 40px)

#### Hero 区域 (900px 高)
- 背景: 抖动效果动画 (蓝色点阵)
- 居中文字:
  - "Design" (160px, Inter Bold)
  - "Universe" (160px, Inter Bold, 左偏移)
- 右下角: "SCROLL" 提示 (竖排文字 + 竖线动画)

#### About 区域 (900px 高)
- 左栏 (固定宽度 500px):
  - 头像: 192x192px 圆形, 带液态变形动画
  - 姓名: "Yangwan" (48px, Inter Bold)
  - 职位: "Interaction Designer" (14px, 橙色)
  - 简介: 14px, Inter Light, 行高 160%
  - 技能标签: 圆角胶囊按钮 (hover 变白底黑字)

- 右栏 (时间轴):
  - 垂直时间线 (1px 白色线条, opacity 10%)
  - 3个玻璃拟态卡片:
    1. 2023-PRESENT: 高级交互设计师
    2. 2021-2023: 全栈设计师
    3. 2019-2021: 视觉设计师
  - 每个卡片左侧有圆点标记
  - Hover 效果: 上移 8px, 边框变橙色, 阴影加深

#### Works 区域 (1000px 高)
- 标题: "SELECTED WORKS" (橙色, 10px, 字间距 20%)
- 横向滚动卡片轮播:
  - 卡片尺寸: 480x500px
  - 5个作品卡片:
    1. 电商平台重设计
    2. 品牌视觉系统
    3. 移动社交探索
    4. 加密艺术画廊
    5. 金融数据看板
  - 每个卡片包含:
    - 背景图片
    - 渐变遮罩 (从透明到黑色)
    - 标题 (32px, Cormorant Garamond)
    - 描述 (14px, 灰色)
    - "查看详情 →" 按钮 (橙色边框, hover 填充)

#### Contact 区域 (900px 高)
- 居中内容:
  - "Let's create" (112px, Cormorant Garamond)
  - "together." (斜体, 橙色)
  - 描述文字
  - 联系方式: EMAIL ME | LINKEDIN | TWITTER
  - Hover 变橙色

### 2. 作品详情页 (Work Detail) - 1440x自适应

#### 导航
- "← 返回" 链接 (左上角)

#### 内容区
- 标题: 112px, Cormorant Garamond Bold
- 副标题: 18px, 灰色, 最大宽度 768px
- 主图: 全宽, 圆角 16px
- 项目信息网格 (3列):
  - 角色 | 时间 | 工具
  - 标签: 橙色, 10px
  - 内容: 灰色, 14px
- 正文内容:
  - H2: 32px, Cormorant Garamond
  - 段落: 14px, 灰色, 行高 relaxed

## 交互动效

### 自定义光标
- 默认: 20x20px 橙色圆环
- Hover: 60x60px 橙色半透明圆
- 混合模式: difference

### 滚动动画
- 元素从下方 40px 淡入
- 缓动函数: cubic-bezier(0.2, 0.8, 0.2, 1)
- 持续时间: 0.8s

### 卡片 Hover
- 上移: -8px
- 背景变亮: opacity 0.03 → 0.06
- 边框: 橙色 30% opacity
- 阴影: 0 20px 40px rgba(0,0,0,0.4)
- 过渡: 0.4s cubic-bezier(0.4, 0, 0.2, 1)

### 液态头像
- 关键帧动画: morph
- 持续时间: 8s
- 缓动: ease-in-out infinite
- 边框半径在两个形状间变化

### 抖动背景
- Canvas 动画
- 8x8px 蓝色方块
- 间距: 12px
- 基于 simplex 噪声的动态分布
- 从中心向外渐变

## 响应式断点

### 桌面 (1440px+)
- 完整布局
- 自定义光标
- 所有动画效果

### 平板 (768px - 1439px)
- 减小边距至 48px
- 字号适当缩小
- 保持双栏布局

### 移动 (<768px)
- 单栏布局
- 边距 24px
- 隐藏自定义光标
- 导航菜单折叠
- 作品卡片宽度 100%

## 可访问性

- 跳转到主内容链接
- 焦点可见性: 2px 橙色轮廓
- 屏幕阅读器文本
- 语义化 HTML 标签
- 键盘导航支持
- 减少动画选项支持

## 实现建议

1. 使用 Auto Layout 创建响应式组件
2. 创建可复用的组件:
   - 导航栏
   - 玻璃拟态卡片
   - 作品卡片
   - 按钮样式
3. 使用 Variants 管理按钮状态
4. 使用 Prototyping 展示交互效果
5. 导出资源时使用 2x 和 3x 分辨率
