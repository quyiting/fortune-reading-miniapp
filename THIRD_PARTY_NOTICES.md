# 第三方内容说明

## freizl/yijing

- 来源：https://github.com/freizl/yijing
- 数据文件：https://github.com/freizl/yijing/blob/main/zh-CN/64gua.json
- 读取日期：2026-10-14
- 许可：MIT，完整条款保存在 `licenses/freizl-yijing-LICENSE`，并附在数据模块源码顶部。
- 作者署名：Copyright (c) 2023 - Present Haisheng Wu。

本项目在 `utils/hexagram-knowledge-data.js` 中引用该数据集的64卦卦名和卦辞，将从初爻到上爻排列的六位编码映射为现有上卦、下卦标识。没有引入第三方程序代码、爻辞全文或现代译注。

古文来自《周易》；各卦的白话提示由本项目编写，用于传统文化阅读与自我复盘，不是逐字翻译。原文和白话在界面中分别标注。

## 离线历法与排盘代码

| 库 | 固定版本 | 来源 | 许可文件 |
| --- | --- | --- | --- |
| lunar-javascript | 1.7.7 | https://github.com/6tail/lunar-javascript | `licenses/lunar-javascript-LICENSE`，MIT |
| iztro | 2.6.3 | https://github.com/SylarLong/iztro | `licenses/iztro-LICENSE`，MIT |
| lunar-lite | 0.2.8 | https://github.com/SylarLong/lunar-lite | `licenses/lunar-lite-LICENSE`，MIT |
| i18next | 23.16.8 | https://github.com/i18next/i18next | `licenses/i18next-LICENSE`，MIT |
| dayjs | 1.11.23 | https://github.com/iamkun/dayjs | `licenses/dayjs-LICENSE`，MIT |
| lunar-typescript | 1.8.6 | https://github.com/6tail/lunar-typescript | `licenses/lunar-typescript-LICENSE`，MIT |
| @babel/runtime | 7.29.10 | https://github.com/babel/babel | `licenses/@babel-runtime-LICENSE`，MIT |

`vendor/lunar.js` 和 `vendor/iztro.js` 由 `scripts/build-vendors.cjs` 构建，完整版权声明在上述文件中保留。传递依赖实际版本由 `package-lock.json` 锁定。构建工具 esbuild、图片处理工具 sharp 只在开发阶段使用，不进入小程序运行包。

## Rider–Waite–Smith 塔罗插画

- 原作：Pamela Colman Smith 绘制，Arthur Edward Waite 设计；原始经典牌面，约1909—1910年。
- 获取来源：Wikimedia Commons，2026-10-18。逐张文件页、原图链接、作者、许可标记和本地 SHA-256 见 `packages/tarot/ASSET_SOURCES.json`。
- 获取脚本只接受 Commons 元数据明确标记为 **Public domain** 的文件，78张均通过此检查。来源示例：[愚者](https://commons.wikimedia.org/wiki/File:RWS_Tarot_00_Fool.jpg)、[圣杯一](https://commons.wikimedia.org/wiki/File:Cups01.jpg)。
- 本地加工：以250px预览图为输入，转换为最大宽200px、质量65的 JPEG（mozjpeg）；未重新着色、未添加其他出版商的背面、边框或现代重绘。
- 图片按来源的公有领域状态提供；项目 MIT 声明不替代素材各文件页的权利状态说明。
- 牌名和基础牌义说明由本项目整理、编写，没有复制现代出版社牌义手册。
