# 旧项目参考记录

本文件记录 `music-trainer-web` 对旧项目的参考和迁移边界。旧项目保持只读，不作为新项目运行时依赖。

## 参考边界

| 规则 | 说明 |
|---|---|
| 不修改旧项目 | 不修改 `../ear-training` 和 `../interval-trainer` |
| 不直接依赖旧路径 | 新项目不通过相对路径 import、fetch 或读取旧项目文件 |
| 复制需记录 | 如需复制音频、样例或逻辑到新项目，应在本文件记录来源和用途 |
| 保留核心闭环 | 新项目必须完整重做两个旧项目的核心功能，而不是只抽取局部能力 |

## ear-training 参考点

| 项目 | 结论 |
|---|---|
| 路径 | `../ear-training` |
| 技术 | HTML、CSS、原生 JavaScript |
| 音频 | 旧项目使用 `data/sound/*.mp3` |
| 音域 | 小字一组 C4、D4、E4、F4、G4、A4、B4 |
| 流程 | 播放 C 到 B 参考音阶，再播放一个随机单音，用户选择音名 |
| 统计 | 当前会话统计总题数、正确率、连对 |
| 新项目处理 | 交互逻辑用 React 重做；旧项目 C4-B4 钢琴 MP3 已复制到本项目内部，不直接读取旧路径 |

## interval-trainer 参考点

| 项目 | 结论 |
|---|---|
| 路径 | `../interval-trainer` |
| 技术 | Python、PyQt5、music21、Pillow、MuseScore |
| 谱号 | 高音、低音、中音、次中音 |
| 题型 | 生成两个音符的五线谱题目 |
| 答题 | 分别判断第一个音、第二个音和音程关系，每组四选一 |
| 反馈 | 选择后锁定该组，标记正确答案和错误选择 |
| 连续练习 | 三组全部完成后自动进入下一题 |
| 可用音程 | 旧项目只接受能映射到 `INTERVAL_NAMES` 的音程名；当前 Web 版保持这个边界，下行两音不进入题库 |
| 新项目处理 | 用 TypeScript 迁移题目生成规则，用 VexFlow 在浏览器内渲染五线谱 |

## 已迁移规则

| 来源 | 已迁移内容 | 新项目位置 |
|---|---|---|
| `../ear-training/src/app.js` | C4-B4 范围、参考音阶、随机单音、答题反馈、会话统计 | `src/domain/earTraining.ts`、`src/ui/pages/EarTrainingPage.tsx` |
| `../interval-trainer/src/interval_trainer/score_generator.py` | 四种谱号、各谱号音域、中文音程名、四选一生成 | `src/domain/staffTrainer.ts` |
| `../interval-trainer/src/interval_trainer/gui.py` | 开始/结束、三组答题、组内锁定、完成后自动下一题 | `src/ui/pages/IntervalTrainerPage.tsx` |

## 已复制内容记录

| 来源 | 新项目位置 | 用途 |
|---|---|---|
| `../ear-training/data/sound/*.mp3` | `public/audio/ear-training/*.mp3` | Ear Training 播放小字一组 C4-B4 参考音阶和随机单音 |
