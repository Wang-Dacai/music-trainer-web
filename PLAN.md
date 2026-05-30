# music-trainer-web 执行计划

本计划以两个完整核心模块为中心：Ear Training 和 Interval Trainer。后续开发不得把两个模块混成单一练习，也不得用额外功能替代这两个核心模块。

## 1. 核心目标

| 模块 | 必须保留的能力 |
|---|---|
| Ear Training | 播放 C 到 B 参考音阶、播放随机单音、音名按钮答题、答案反馈、当前会话统计 |
| Interval Trainer | 生成两个音符的五线谱题目、支持四种谱号、分别判断第一个音、第二个音、音程关系、四选一反馈、连续练习 |

## 2. 当前实现状态

| 项目 | 状态 | 文件 |
|---|---|---|
| 双模块入口 | 已完成 | `src/App.tsx` |
| Ear Training 页面 | 已完成，单排音名按钮和紧凑统计 | `src/ui/pages/EarTrainingPage.tsx` |
| Ear Training 领域逻辑 | 已完成 | `src/domain/earTraining.ts` |
| Interval Trainer 页面 | 已完成，按需加载 | `src/ui/pages/IntervalTrainerPage.tsx` |
| 五线谱渲染 | 已完成，自托管 VexFlow 字体并渲染 SVG | `src/ui/components/StaffNotation.tsx`、`public/fonts/vexflow/` |
| Interval Trainer 题目生成 | 已完成 | `src/domain/staffTrainer.ts` |
| 通用音高和音频播放 | 已完成 | `src/domain/pitch.ts`、`src/audio/` |
| Ear Training 钢琴采样 | 已完成 | `public/audio/ear-training/`、`src/audio/pianoSamples.ts` |
| 单元测试 | 已完成 | `src/domain/*.test.ts` |
| 页面级测试 | 已完成 | `src/ui/pages/*.test.tsx` |

## 3. 旧项目迁移原则

| 原则 | 说明 |
|---|---|
| 旧项目只读 | 不修改 `../ear-training` 和 `../interval-trainer` |
| 不直接依赖旧路径 | 新项目运行时不 import、fetch 或读取旧项目文件 |
| 功能完整迁移 | 迁移核心交互闭环，而不是抽取一小段功能 |
| 模块独立共存 | Ear Training 和 Interval Trainer 在入口并列切换，内部状态互不混淆 |

## 4. 下一阶段建议

| 优先级 | 任务 | 说明 |
|---|---|---|
| P1 | Interval Trainer 会话统计 | 可统计每题三组判断的正确率，但不能替代核心作答流程 |
| P2 | Ear Training 音量和节奏设置 | 当前已切换到钢琴采样；后续可加用户可调音量和播放速度 |
| P2 | PWA 离线能力 | 核心功能稳定后再加入 |

## 5. 验收标准

| 模块 | 验收标准 |
|---|---|
| Ear Training | 点击开始后依次播放 C 到 B 和随机单音；进入可答题状态；点击音名后显示反馈并更新总题数、正确题数、正确率、当前连对 |
| Interval Trainer | 点击开始后显示两个音符的五线谱；三组四选一分别可答；每组答后锁定并显示正确/错误；三组完成后自动下一题 |
| 文档 | README 和接手说明明确两个核心模块，不再描述旧的混合音程听辨路线 |
| 构建 | `npm test -- --run` 和 `npm run build` 通过 |
