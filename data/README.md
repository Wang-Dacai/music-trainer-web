# music-trainer-web 数据目录

本目录存放 `music-trainer-web` 项目开发和运行相关的数据说明、样例和本地生成内容。

## 目录约定

| 路径 | 用途 | 是否提交 |
|---|---|---|
| `README.md` | 数据目录说明 | 是 |
| `samples/` | 小型样例、fixture、可复现测试数据 | 是 |
| `input/` | 本地原始素材、大体积输入文件 | 否 |
| `output/` | 导出结果、生成文件 | 否 |
| `cache/` | 本地缓存 | 否 |

## 与 Web 静态资源的区别

浏览器运行时需要直接访问、并随网页分发的资源应放在 `public/` 下，例如：

```text
public/audio/
```

`data/` 更适合放开发期样例、测试 fixture、原始素材说明和本地生成数据。

## 旧项目素材

如果后续需要复用 `../ear-training` 或 `../interval-trainer` 中的素材，不要从新项目直接引用旧路径。应复制到本项目内部，并在 `docs/legacy-reference.md` 说明来源、用途和许可/来源备注。