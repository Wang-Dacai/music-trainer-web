# 音乐训练 Web 应用

`music-trainer-web` 是一个 Web 优先的音乐训练应用。当前项目的核心不是把旧功能裁剪后混合成一个练习，而是完整保留并重做两个独立模块：`ear-training` 的单音听辨，以及 `interval-trainer` 的五线谱音符与音程判断。

## 核心模块

| 模块 | 目标 | 当前状态 |
|---|---|---|
| Ear Training | 播放 C 到 B 的参考音阶，再播放随机单音，用户判断音高 | 已实现 |
| Interval Trainer | 自动生成两个音符的五线谱题目，用户判断第一个音、第二个音和音程关系 | 已实现 |

## Ear Training 功能

| 功能 | 说明 |
|---|---|
| 参考音阶 | 播放小字一组 C4 到 B4 |
| 随机单音 | 每题播放一个随机目标音 |
| 答题方式 | 用户点击 C、D、E、F、G、A、B 音名按钮，也支持键盘输入 |
| 答案反馈 | 标记正确答案和错误选择 |
| 会话统计 | 当前会话统计总题数、正确题数、正确率、当前连对次数 |
| 控制按钮 | 开始、重播音阶、重播单音、停止、清空统计 |

## Interval Trainer 功能

| 功能 | 说明 |
|---|---|
| 五线谱题目 | 每题自动生成两个音符并渲染为五线谱 |
| 谱号选择 | 支持高音、低音、中音、次中音谱号 |
| 第一个音判断 | 四选一判断谱面左侧音符 |
| 第二个音判断 | 四选一判断谱面右侧音符 |
| 音程关系判断 | 四选一判断两个音之间的中文音程名称 |
| 答案反馈 | 每组选择后锁定该组，正确答案显示为正确色，错误选择显示为错误色 |
| 连续练习 | 三组判断全部完成后自动进入下一题 |

## 与旧项目的关系

| 旧项目 | 保留的核心能力 | 新项目实现方式 |
|---|---|---|
| `../ear-training` | 参考音阶、随机单音、音名判断、会话统计 | 使用 React 重做交互，并将旧项目 C4-B4 钢琴采样复制到本项目内部使用 |
| `../interval-trainer` | 四种谱号、两音五线谱题、三组四选一、即时反馈、连续练习 | 使用 TypeScript 生成题目，使用 VexFlow 在浏览器内渲染五线谱 |

旧项目保持只读。本项目不从旧项目路径 import、fetch 或读取运行时素材。如需复制旧素材，应放到本项目内部并在 [docs/legacy-reference.md](docs/legacy-reference.md) 记录。

## 技术栈

| 层次 | 方案 |
|---|---|
| 构建工具 | Vite |
| UI | React |
| 类型系统 | TypeScript |
| 测试 | Vitest |
| 音频 | Ear Training 使用本项目内钢琴 MP3 采样，保留 Web Audio 封装供后续扩展 |
| 五线谱 | VexFlow |
| 分发 | 静态 Web 页面，后续可升级为 PWA |

## 运行方式

| 命令 | 用途 |
|---|---|
| `npm install` | 安装依赖 |
| `npm run dev` | 启动本地开发服务器 |
| `npm test -- --run` | 运行单元测试 |
| `npm run build` | 生产构建 |
| `npm run preview` | 本地预览生产构建 |

## 目录结构

| 路径 | 说明 |
|---|---|
| `src/App.tsx` | 双模块入口和模块切换 |
| `src/ui/pages/EarTrainingPage.tsx` | Ear Training 单音听辨页面 |
| `src/ui/pages/IntervalTrainerPage.tsx` | Interval Trainer 五线谱练习页面 |
| `src/ui/components/StaffNotation.tsx` | VexFlow 五线谱渲染组件 |
| `src/domain/earTraining.ts` | 单音听辨音域、随机目标和会话统计逻辑 |
| `src/domain/staffTrainer.ts` | 谱号音域、两音题生成、音程计算和四选一生成 |
| `src/domain/pitch.ts` | 通用音高、MIDI 和频率工具 |
| `src/audio/` | 钢琴采样播放和 Web Audio 播放封装 |
| `public/audio/ear-training/` | Ear Training 使用的小字一组 C4-B4 钢琴采样 |
| `public/fonts/vexflow/` | VexFlow 五线谱渲染使用的 Bravura 和 Academico 字体 |
| `src/ui/pages/*.test.tsx` | 两个核心模块的页面级交互测试 |
| `data/` | 开发期样例、输入、输出和缓存说明 |
| `docs/` | 旧项目参考记录和 AI 接手说明 |

## 当前边界

| 项目 | 状态 |
|---|---|
| Ear Training 会话统计 | 当前页面会话内统计，刷新后重置 |
| Interval Trainer 长期统计 | 暂未实现，当前重点是题目和交互闭环 |
| Interval Trainer 下行两音 | 保持旧项目可用题目边界：不能映射到中文音程名的下行两音不进入题库 |
| 构建体积 | Interval Trainer 按需加载，VexFlow 不进入 Ear Training 首屏包 |
| 音频素材 | 已复制旧项目 C4-B4 钢琴 MP3 到本项目内部，不在运行时读取旧路径 |
| 五线谱字体 | 已自托管 VexFlow 字体文件，避免运行时依赖旧项目或外部字体路径 |
| 五线谱图片缓存 | Web 版不生成 PNG 缓存，直接在浏览器渲染 SVG |

## 验证状态

最近验证命令：

```bash
npm test -- --run
npm run build
```

Playwright 已验收本地页面：

| 模块 | 验收项 |
|---|---|
| Ear Training | 页面只显示一排 C 到 B 音名按钮，统计区保持紧凑；页面测试覆盖答题和统计更新 |
| Interval Trainer | 可切换到模块，开始后能渲染五线谱并生成三组四选一；页面测试覆盖三组作答后自动进入下一题 |
