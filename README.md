# 干部人格档案 · 《人民的名义》MBTI 测评

一个纯静态的人格测评单页应用：32 题 → 4 维分数 → 在 16 位剧中人物中找到最像你的那一位。

视觉取档案卷宗风，文字排版走 chenglou/pretext 精排路线。结果页链接无后端依赖，完全编码在 URL hash 里，可跨设备复活。

## 本地开发

```bash
bun install
bun run dev       # http://localhost:5173
bun test          # 引擎单元测试
bun run lint      # oxlint
bun run build     # 产出 dist/
bun run preview   # 本地预览产物
```

## 技术栈

- Bun 运行时 / 包管理 / 测试
- Vite 静态打包
- TypeScript strict，无框架（原生 DOM + hash router）
- `@chenglou/pretext` 中文文本精排
- `qrcode-generator` 二维码生成
- oxlint 代码检查

## 目录

- `src/engine/` — 纯函数：计分、分类、阵营、相似度、URL 编解码
- `src/content/` — 32 题题库 + 16 人档案 + UI 文案
- `src/routes/` — 首页 / 答题 / 结果
- `src/share/` — 分享长图（1080×1920 PNG）+ 二维码
- `src/dom/` — DOM 辅助 + pretext 段落包装
- `public/characters/` — 16 位角色剧照（JPG）

## 部署（Cloudflare Pages）

```bash
bun run build
bun x wrangler login                # 首次
bun run deploy                      # bun x wrangler pages deploy dist
```

配置见 `wrangler.toml`（项目名 `handong-archive`）。

## 设计与计划文档

- 设计：`docs/superpowers/specs/2026-04-20-renminzhiming-mbti-design.md`
- 实施：`docs/superpowers/plans/2026-04-20-renminzhiming-mbti.md`

## 已知限制

- 字体走系统 CJK 字体栈（Songti SC / Noto Serif CJK SC / STSong）；如需离线自部署，把 woff2 子集文件放到 `public/fonts/` 并在 `style.css` 补 `@font-face`
- 纸张噪点纹理用的是 CSS 内生成的 radial gradient，非真纸纹

## 授权与版权

《人民的名义》剧照版权归剧集出品方所有，本项目非商业粉丝向使用；若权利方有正式异议，立即下架相关素材。
