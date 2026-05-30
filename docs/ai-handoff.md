# AI 接手说明

更新日期：2026-05-29。

## 1. 当前方向

`music-trainer-web` 当前必须围绕两个独立核心模块开发：

| 模块 | 说明 |
|---|---|
| Ear Training | 完整重做 `../ear-training` 的单音听辨核心流程 |
| Interval Trainer | 完整重做 `../interval-trainer` 的五线谱两音题核心流程 |

不要把两个模块合并成一个模糊的音程听辨练习。此前的音程听辨实验代码已从源码中移除。

## 2. 技术栈

| 层次 | 当前选择 |
|---|---|
| 构建工具 | Vite |
| UI | React |
| 类型系统 | TypeScript |
| 测试 | Vitest |
| 音频 | Ear Training 使用本项目内钢琴 MP3 采样，保留 Web Audio 封装 |
| 五线谱 | VexFlow |

## 3. 关键文件

| 文件 | 作用 |
|---|---|
| [../src/App.tsx](../src/App.tsx) | 顶层双模块切换 |
| [../src/ui/pages/EarTrainingPage.tsx](../src/ui/pages/EarTrainingPage.tsx) | 单音听辨完整页面 |
| [../src/ui/pages/IntervalTrainerPage.tsx](../src/ui/pages/IntervalTrainerPage.tsx) | 五线谱音符与音程判断完整页面 |
| [../src/ui/components/StaffNotation.tsx](../src/ui/components/StaffNotation.tsx) | VexFlow SVG 五线谱渲染 |
| [../public/fonts/vexflow/](../public/fonts/vexflow/) | VexFlow Bravura 和 Academico 字体文件 |
| [../src/domain/earTraining.ts](../src/domain/earTraining.ts) | Ear Training 音域、随机单音和统计逻辑 |
| [../src/domain/staffTrainer.ts](../src/domain/staffTrainer.ts) | Interval Trainer 谱号、音域、题目生成、音程名和选项逻辑 |
| [../src/domain/pitch.ts](../src/domain/pitch.ts) | 通用音高、MIDI 和频率工具 |
| [../src/audio/pianoSamples.ts](../src/audio/pianoSamples.ts) | Ear Training 钢琴 MP3 采样播放 |
| [../src/audio/engine.ts](../src/audio/engine.ts) | Web Audio 底层播放 |
| [../src/audio/playback.ts](../src/audio/playback.ts) | 按音高播放的封装 |
| [../src/ui/pages/EarTrainingPage.test.tsx](../src/ui/pages/EarTrainingPage.test.tsx) | 单音听辨页面流程测试 |
| [../src/ui/pages/IntervalTrainerPage.test.tsx](../src/ui/pages/IntervalTrainerPage.test.tsx) | 五线谱练习页面流程测试 |

## 4. 已实现功能

| 模块 | 已实现 |
|---|---|
| Ear Training | C4 到 B4 钢琴采样参考音阶、随机单音、单排音名按钮、键盘答题、反馈、紧凑统计、重播音阶、重播单音、停止、清空统计 |
| Interval Trainer | 高音/低音/中音/次中音谱号、两音题生成、按需加载 VexFlow 五线谱、三组四选一、组内锁定、正确/错误反馈、完成后自动下一题 |
| 测试覆盖 | 领域模型测试和页面级交互测试 |

## 5. 旧项目参考

| 旧项目 | 新项目处理 |
|---|---|
| `../ear-training` | 参考交互流程和 C4-B4 范围；已复制 C4-B4 MP3 到 `public/audio/ear-training/` |
| `../interval-trainer` | 迁移谱号、音域、中文音程名、三组四选一和自动下一题；不依赖 PyQt、music21、MuseScore 或 PNG 缓存 |

更多旧项目边界见 [legacy-reference.md](legacy-reference.md)。

## 6. 验证命令

在项目目录运行：

```bash
npm test -- --run
npm run build
npm run dev
```

最近一次已通过：

| 验证 | 结果 |
|---|---|
| 测试 | 通过，覆盖领域模型和两个核心页面流程 |
| 生产构建 | 通过，Interval Trainer 已拆成独立 chunk |
| Playwright 本地验收 | 通过，两个模块可切换，五线谱可渲染，Interval Trainer 三组作答后自动下一题 |

## 7. 后续注意

| 注意事项 | 说明 |
|---|---|
| 模块边界 | Ear Training 是听单音；Interval Trainer 是看五线谱，不要混成单一练习 |
| 旧项目路径 | 运行时不得直接读取旧项目源码或素材 |
| 构建体积 | Interval Trainer 已动态导入；后续只有在部署有更严格体积预算时再继续压缩 |
| 下行音程 | 当前保持旧项目可用题目边界：下行两音不进入题库 |
