# 架构与设计白皮书：Open Source Projects Showcase

*为人类开发者与 AI 编码智能体构建的双模边缘展示平台。*

- **代码仓库：** [LoveDoLove/open-source-projects](https://github.com/LoveDoLove/open-source-projects)
- **线上部署：** [open-source-projects.lovedolove.workers.dev](https://open-source-projects.lovedolove.workers.dev)
- **系统版本：** 2.2.0
- **语言版本：** [English](whitepaper.md) | 简体中文

---

## 1. 执行摘要与项目愿景

现代软件工程正在经历深刻变革，人类开发者与自主 AI 编码智能体（AI Coding Agents）的协同成为常态。然而，人类开发者习惯通过直观、富有交互性的图形界面获取信息，而 AI 智能体（如 Cursor、Claude Code、DeepSeek Harness 等）则需要高度精炼、结构化且语义明确的文本，以严格控制上下文窗口（Context Window）的 Token 消耗。

传统的开源展示目录或个人主页无法兼顾这两种截然不同的受众：
- **常规 Web 页面过于臃肿：** 传统网页通常包含大量样式表、脚本、导航标签和 DOM 嵌套。当 AI 智能体请求一个普通页面时，仅仅为了提取数个仓库的名称和描述，就可能消耗 5,000 到 25,000 个 Token。
- **专有 API 存在使用壁垒：** 维护专有 REST API 需要额外的文档、客户端适配、身份认证，并伴随端点发现的多次往返请求。

Open Source Projects Showcase (OSPS) 提出并实现了一种边缘原生的“双模呈现”架构（Dual-Mode Delivery）。通过部署在 Cloudflare Workers 上，并深度结合静态资源绑定（Static Assets）与 HTTP 内容协商机制，OSPS 能够通过同一个规范 URL 同时满足人类与智能体：
- **面向人类浏览器：** 提供基于原生 Web 标准构建的无框架轻量单页应用，享受全球边缘网络带来的亚毫秒级静态资源分发。
- **面向 AI 智能体：** 客户端只需在请求中附带 `Accept: text/markdown`，边缘 Worker 即可在毫秒级内动态返回结构纯净的 Markdown 文档，整站 Token 消耗低于 600，并通过 `x-markdown-tokens` 响应头主动告知负载大小。

OSPS 的核心愿景是：在 AI 智能体时代，为个人与组织的开源项目集提供一套零维护、零成本、智能体友好的现代化展示标准。

---

## 2. 核心设计理念

OSPS 严格遵循四大设计哲学：

### 2.1 双模呈现原则（Dual-Representation Principle）
在智能体时代，展示平台必须同时满足人类评估者的视觉交互体验与自动化工具的语义处理效率。系统不应维护割裂的独立域名或子目录，而应依托标准 HTTP 头部，使单一规范路径（`/`）具备根据调用方需求自适应呈现的能力。

### 2.2 零构建、零框架运行时（Zero-Build, Zero-Framework）
现代前端框架在带来便利的同时也引入了打包臃肿、构建流程脆弱和依赖供应链安全风险。OSPS 客户端采用原生 HTML5、CSS 自定义属性及 ES6+ 原生 JavaScript，无需 Babel、Vite、Webpack 等任何打包构建工具。边缘代码也是单文件 JavaScript，直接由 Cloudflare Workers V8 隔离环境（Isolates）加载执行。

### 2.3 配置与元数据的严格解耦（Separation of Concerns）
系统严格区分人类意图与机器派生数据：
- `data/projects.json` 是仓库配置的唯一真实来源（Source of Truth）。贡献者仅需在此声明平台与项目名称。
- `public/data/projects.json` 则是自动化脚本拉取 GitHub 实时状态后派生生成的产物，包含星标、分支、主题、描述和最新更新时间。
人工维护永不手动修改派生文件，自动化流水线也绝不侵入修改用户配置。

### 2.4 幂等且整洁的 Git 历史（Idempotent Git History）
日常运行的元数据同步机器人若处理不当，会产生数以千计的琐碎提交，严重污染 Git 版本树。OSPS 设计了原子化提交折叠算法，自动将前序机器人的每日提交软重置折叠，实现“每日更新替换前日，历史常青清晰”。

---

## 3. 系统整体架构

系统分为三个松耦合层级：开发者与客户端层、Cloudflare 边缘运行时层、持续数据自动化流水线层。

```
+-----------------------------------------------------------------------------------+
|                           开发者与客户端层 (Client Layer)                          |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|      +-------------------------+                 +-------------------------+      |
|      |     人类浏览器访问      |                 |    AI 编码智能体客户端  |      |
|      |   (Accept: text/html)   |                 | (Accept: text/markdown) |      |
|      +------------+------------+                 +------------+------------+      |
+-------------------|-------------------------------------------|-------------------+
                    |                                           |
                    |           HTTP GET /                      |
                    +--------------------+----------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                      CLOUDFLARE 边缘运行时层 (Edge Runtime)                       |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                          +---------------------------+                            |
|                          |    src/index.js (Worker)  |                            |
|                          | run_worker_first: ["/"]   |                            |
|                          +-------------+-------------+                            |
|                                        |                                          |
|                  +---------------------+---------------------+                    |
|                  |                                           |                    |
|       [Accept: text/markdown]                       [其它常规请求]                |
|                  |                                           |                    |
|                  v                                           v                    |
|   +-----------------------------+             +-----------------------------+     |
|   | 1. 从 env.ASSETS 读取       |             | 直接转发给                  |     |
|   |    /data/projects.json      |             | env.ASSETS.fetch(request)   |     |
|   | 2. renderMarkdown() 格式化  |             +--------------+--------------+     |
|   | 3. 注入 Vary 及 Token 估算头|                            |                    |
|   +--------------+--------------+                            v                    |
|                  |                            +-----------------------------+     |
|                  v                            | 分发 public/index.html 页面 |     |
|   返回纯净 Markdown 文档                      | 浏览器异步加载 JSON 渲染卡片|     |
|   (整站仅 ~600 Tokens)                        +-----------------------------+     |
|                                                                                   |
+-----------------------------------------------------------------------------------+
                                         ^
                                         | 监听 main 分支推送自动重部署
+-----------------------------------------------------------------------------------+
|                      自动化持续集成层 (CI/CD Pipeline)                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +--------------------+         +--------------------+     +-------------------+  |
|  | data/projects.json | ------> | scripts/           | --> | public/data/      |  |
|  | (人工配置事实来源) |         | fetchRepoMetadata  |     | projects.json     |  |
|  +--------------------+         +---------+----------+     +---------+---------+  |
|                                           |                          |            |
|                                           v                          v            |
|                                  GitHub REST API v3        原子化提交折叠与       |
|                                                            安全租约 Git 推送      |
+-----------------------------------------------------------------------------------+
```

---

## 4. 核心概念与数据规范

### 4.1 面向智能体的 Markdown 协商规范
Cloudflare 的原生“Markdown for Agents”功能仅限企业或 Pro 付费域名使用。OSPS 在 Worker 边缘逻辑中原生实现了完全开放、免费可用的对等功能：

1. **路径匹配：** 拦截针对根路径 `/` 与 `/index.html` 的请求。
2. **标头侦测：** 检查 HTTP `Accept` 头部是否包含 `text/markdown`。
3. **内部读取：** 直接利用 Worker 的 `env.ASSETS` 绑定获取同机房内的静态数据，无网络延迟。
4. **动态转换：** 提取项目名称、地址、描述、星标数、分支数、更新时间及主题标签，拼装标准 Markdown。
5. **缓存控制与协商响应：** 返回包含下列响应头的输出：
   - `content-type: text/markdown; charset=utf-8`：明确指明文档格式为 Markdown。
   - `vary: Accept`：防止 CDN 或浏览器缓存将 Markdown 缓存给普通浏览器用户，确保安全隔离。
   - `cache-control: public, max-age=3600`：保证 1 小时边缘缓存，提高吞吐量。
   - `x-markdown-tokens: <count>`：依据 `Math.ceil(markdown.length / 4)` 实时输出预估 Token 数量。

### 4.2 数据契约规范

#### 输入配置规范 (`data/projects.json`)
```json
[
  {
    "github": [
      {
        "username": "LoveDoLove",
        "projects": ["Veyra", "open-source-projects"]
      }
    ],
    "gitlab": [],
    "gitee": [],
    "bitbucket": []
  }
]
```

#### 产出数据契约 (`public/data/projects.json`)
每个项目包含如下固定字段：
- `repo` (string)：仓库唯一标识符。
- `name` (string)：显示名称。
- `description` (string)：项目简述。
- `html_url` (string)：GitHub 仓库 URL。
- `homepage` (string)：项目主页或文档外链。
- `stargazers_count` (number)：星标总数。
- `forks_count` (number)：分支总数。
- `topics` (string[])：分类主题标签列表。
- `updated_at` (string)：ISO-8601 标准最后更新时间戳。

---

## 5. 关键技术细节与实现

### 5.1 边缘静态资源路由穿透 (`run_worker_first`)
在 Cloudflare Workers 架构中，静态资产（Static Assets）具备高优先级：一旦静态目录中存在与请求路径匹配的文件（例如 `/index.html` 对应根路径），Workers 将直接返回该文件，不再执行 `src/index.js` 中的代码。

OSPS 在 `wrangler.jsonc` 中配置了关键路由指令：
```jsonc
"assets": {
  "directory": "./public",
  "binding": "ASSETS",
  "run_worker_first": ["/", "/index.html"]
}
```
此规则确保所有针对根路径的请求优先进入 Worker 逻辑进行 `Accept` 头判断，这是实现“双模呈现”的技术底座。

### 5.2 稳健的元数据收割机制
`scripts/fetchRepoMetadata.js` 支持环境感知的 HTTP 通信：
- 在 Node.js 18+ 环境下直接使用全局原生 `fetch`；
- 支持通过 `GITHUB_TOKEN` 环境变量进行 Bearer 认证，将 API 调用限额从每小时 60 次提升至 5,000 次；
- 遇到单个仓库不可用或速率超限时，输出警示日志并生成默认占位记录，保证全量抓取流程不中断。

### 5.3 原子化提交折叠与安全并发保护
工作流 `.github/workflows/fetch-repo-metadata.yml` 实现了精巧的 Git 状态机：
1. **差异预检：** 若生成的元数据与当前 `HEAD` 完全一致，立即安全退出，避免产生空提交；
2. **提交折叠：** 检查历史记录中最近由 `github-actions[bot]` 发起的同名提交，使用 `git reset --soft HEAD~1` 回退多达 5 次历史自动化提交；
3. **干净隔离：** 通过 `git checkout HEAD -- .` 恢复非目标文件的任何扰动，确保变更严格局限于元数据文件；
4. **安全租约推送：** 使用 `git push --force-with-lease` 推送更新；
5. **并发冲突恢复：** 一旦检测到人类在远端并发提交了代码，租约检查会自动失败保护现场；脚本随后拉取最新远端代码，将派生的最新元数据重放并以正常提交合入分支。

---

## 6. 性能、经济性与安全架构

### 6.1 性能测试与指标
- **首屏延迟：** 全球 CDN 边缘缓存静态分发，首屏响应低于 20ms。
- **Markdown 边缘生成：** Cloudflare V8 隔离环境内就近执行，动态渲染耗时低于 5ms，无冷启动开销。
- **传输体积削减：** 对比传统 React/Vue Showcase 单页应用（通常动辄 50KB 至 200KB 资源加载），OSPS Markdown 传输量仅约 3KB，节省 90% 以上的数据传输与 LLM 消耗。

### 6.2 零成本经济模型
系统完整运行在免费层级内：
- Cloudflare Workers 免费计划提供每日 100,000 次调用与充足的静态资源流量；
- GitHub Actions 提供充足的公共仓库构建时长；
- 整体架构运营成本为 $0/月。

### 6.3 安全模型
- **零后端攻击面：** 无常驻服务器、无数据库、无运行时容器，彻底消除注入与运维风险；
- **只读边缘沙箱：** Worker 运行期对静态资产仅有只读权限；
- **凭证隔离：** GitHub API 密钥仅在 GitHub Actions 安全环境内生效，永不注入客户端或构建包。

---

## 7. 未来演进路线

### 7.1 第一阶段：多代码托管平台支持
激活 `data/projects.json` 中预留的 GitLab、Gitee 及 Bitbucket 配置，编写对应的平台元数据拉取器。

### 7.2 第二阶段：无依赖客户端即时检索与筛选
在前端引入基于原生 JavaScript 的模糊过滤机制，支持按仓库名称、描述文本、Topic 标签快速筛选，无需任何外部第三方库。

### 7.3 第三阶段：WebMCP 与智能体发现端点
提供 `/.well-known/ai-plugin.json` 或 WebMCP 规范发现接口，让 AI 编码智能体能够以更细粒度的结构化形式查询特定项目指标。