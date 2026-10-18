# 大可不必算

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: WeChat Mini Program](https://img.shields.io/badge/Platform-WeChat%20Mini%20Program-07C160.svg)](https://developers.weixin.qq.com/miniprogram/dev/framework/)

**English overview:** A local-first WeChat Mini Program for daily fortune draws, I Ching, tarot, BaZi, and Zi Wei readings. Results and notes are saved on-device for later review.

一个免费的原生微信小程序，提供今日一签、主题抽签、六爻、梅花、塔罗、八字、紫微与本机复盘记录。用轻量的传统文化阅读体验，给当下的问题留一句提醒，也给日后的自己留一份对照。

**核心流程：抽签或问事 → 阅读简明结果 → 本机保存 → 回看原结果 → 补充回访或分享海报。**

当前版本使用本地规则和内容模板生成结果，无需注册、配置大模型 API 或部署后端；命盘功能由用户自行填写出生信息。内容仅供传统文化娱乐和自我探索参考；各体系采用下文注明的规则与固定版本排盘库，精度及完整性尚未经过专业校验。

## 功能

| 功能 | 说明 |
| --- | --- |
| 今日一签 | 按本机日期固定完整签文，当天重复打开不新增记录，跨天可重新揭签 |
| 主题抽签 | 选择主题和面对方式，阅读签文、一句提醒与行动建议 |
| 六爻问事 | 分类与问题引导、六次投币逐爻展示、本卦和变卦；动画可跳过 |
| 卦象知识 | 64卦的卦名、卦序、《周易》卦辞原文及本项目编写的白话提示 |
| 分层解读 | 优先展示简明结果，详细签意、世应、用神、纳甲等内容按需展开 |
| 梅花易数 | 两数起卦，本卦、互卦、变卦、体用与计算规则 |
| 塔罗 | 78张经典插画牌，单张/三张牌阵，正逆位与逐张翻牌 |
| 八字 | 公历/农历输入，四柱、十神、藏干、五行字面分布和大运；未知时刻仅三柱参考 |
| 紫微斗数 | 十二宫、主辅星、四化、大限与本项目基础提示 |
| 本机记录 | 完整结果回看、类型筛选、单条删除、20条容量上限与替换确认 |
| 回访复盘 | 六爻回访状态，所有类型均可添加最多200字备注，支持修改、清空和再次查看 |
| 结果海报 | 各体系均可生成文字结果海报，预览并保存到相册 |

## 快速开始

### 环境

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
- 一个你有开发权限的小程序 AppID。
- Node.js 22或更新版本，用于运行自动检查。

### 导入项目

```bash
git clone https://github.com/quyiting/fortune-reading-miniapp.git
cd fortune-reading-miniapp
```

1. 在微信开发者工具中导入仓库根目录，项目类型选择“小程序”。
2. 在项目设置中，将 `project.config.json` 的 AppID 替换为你自己的 AppID。
3. 编译后，通过“首页 / 问事 / 命盘 / 记录”四栏体验各体系。
4. 生成结果后，进入“记录”筛选并回看完整内容；六爻可标记回访状态，各类结果都可写备注。

当前小程序主流程无需执行 `npm install`，也无需开通云开发。仓库中保留的 `cloudfunctions/` 是历史代码，默认体验没有启用；如需继续开发云端能力，需要单独配置、安装依赖和验证。

`project.private.config.json` 是微信开发者工具的本机配置，已加入 `.gitignore`。

## 排盘与素材规则

- 时间采用北京时间 UTC+8 标准时，不校正真太阳时或历史夏令时；支持1900—2100年的公历、农历及合法闰月。
- 八字采用 `lunar-javascript@1.7.7`，年、月依节气，日柱零点换日（sect=2），起运算法2。未知时刻按当日12:00提供三柱参考，不排时柱与起运；节气交接日需补充时刻核对。五行仅展示字面数量，不推断旺衰或喜用神。
- 紫微采用 `iztro@2.6.3`，农历年界、晚子时按当日、闰月中分（fixLeap=true）；未知时刻不能排盘。配置及完整星曜保存在结果快照中。
- 塔罗牌面采用 Wikimedia Commons 标记为 Public domain 的 Rider–Waite–Smith 原作扫描，78张逐项来源与哈希见 [素材清单](packages/tarot/ASSET_SOURCES.json)。基础牌义与命盘提示由本项目编写，无 AI 调用。

## 本地检查

在仓库根目录运行：

```bash
node --test tests/*.test.js
git diff --check
```

自动检查另覆盖塔罗不重复抽牌与完整翻牌保存、梅花公式、历法与子时边界、未知时刻、出生资料同意及删除；原有检查覆盖每日签日期稳定与去重、逐爻展示和跳过、64卦知识对应、完整结果存储与回看、回访备注、删除、容量确认、历史摘要兼容、保存失败和海报回调。

微信存储、导航、弹窗与 Canvas 接口使用测试适配器。模拟器与真机画面、动画和相册授权需要另行验收，具体步骤见[开发与验收](docs/DEVELOPMENT.md)。

### 重建排盘库和牌面

仓库已提交离线运行文件，直接导入不需安装依赖。修改依赖或重新生成素材时：

```bash
npm ci
npm run build:vendors
# 仅需要重新获取牌面时执行（访问 Wikimedia Commons）
python3 scripts/fetch-tarot-assets.py
```

固定版本与传递依赖由 `package-lock.json` 约束。运行时使用主包中的离线排盘库与塔罗图片分包，不依赖外部图片服务器；第三方许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 数据与隐私

- 默认体验使用微信本地存储，问事内容、结果和回访备注保存在当前设备，不会上传到项目服务器。
- 最多保留20条记录，按最近创建或回访更新时间排序；满额后新增会先确认，再替换最久未更新的一条。
- 回看读取当时保存的完整结果，不重新抽签或起卦。早期仅保存摘要的记录无法补回原始完整结果。
- 当日签文单独缓存；删除或清空历史不会重置当日签文，回看也不会自动恢复已删除的历史。
- 出生资料只有勾选后才单独保存到本机，八字和紫微共用，可修改或删除。生成时未勾选会移除已存资料；命盘历史仍包含当时输入，需在记录页单独删除对应记录。
- 当前没有跨设备同步或恢复功能。换设备、卸载或清理小程序数据后，本机记录可能丢失。
- 小程序分享卡片用于邀请体验；分享当时的完整结果请使用海报。保存海报需要微信提供的相册权限。

存储键及详细行为见[本地记录规则](docs/DEVELOPMENT.md#本地记录规则)。

## 项目结构

```text
.
├── app.js / app.json / app.wxss    # 小程序入口、路由和全局样式
├── pages/
│   ├── index/                     # 今日一签、功能入口与最近记录
│   ├── draw/                      # 今日一签、主题抽签和签文海报
│   ├── yao/                       # 六爻问事、知识卡片、回访和卦单海报
│   ├── meihua/                    # 数字梅花问事
│   ├── natal/                     # 共用出生表单、八字和紫微
│   ├── profile/                   # 本机记录、筛选、删除和回访
│   └── chart/                     # 保留的历史星盘页面
├── packages/tarot/                # 塔罗页面、78张离线插画及来源清单
├── vendor/                        # 固定版本的离线排盘库
├── scripts/                       # 可复现构建和素材获取
├── utils/                         # 内容、历法、生成规则和本机存储
├── templates/                     # 海报预览与备注编辑模板
├── tests/                         # Node 行为检查与微信接口适配器
├── docs/                          # 开发说明与微信环境验收步骤
├── cloudfunctions/                # 保留的历史云函数，默认未启用
├── licenses/                      # 第三方许可证
├── THIRD_PARTY_NOTICES.md          # 第三方内容来源与引用范围
└── LICENSE                        # 项目 MIT 许可证
```

当前开放入口以 `app.json` 为准，星盘页面未注册。

## 参与贡献

欢迎通过 [Issues](https://github.com/quyiting/fortune-reading-miniapp/issues) 报告问题或讨论功能，通过 Pull Request 提交改进。

1. Fork 仓库并创建独立分支。
2. 保持改动范围清楚；行为修改请补充对应的回归检查，规则或历法修正请给出依据与可复现案例。
3. 运行上述本地检查。界面或权限相关变更，请补充微信开发者工具版本、复现步骤和实际验证结果。
4. 在 PR 中说明改了什么、为什么修改、如何验证，以及尚未验证的部分。

提交代码、日志和截图前，请移除密钥、访问令牌、个人问事内容及其他敏感信息。新增第三方代码或数据时，请同步补充来源、许可证和必要署名。

## 致谢与第三方内容

64卦卦辞数据摘自 [freizl/yijing](https://github.com/freizl/yijing) 的 `zh-CN/64gua.json`，采用 MIT 协议。项目保留了原作者版权及完整许可条款；白话提示为本项目编写，与古文分别标注。

引用范围、来源和许可证见[第三方内容说明](THIRD_PARTY_NOTICES.md)及 [freizl/yijing 许可证](licenses/freizl-yijing-LICENSE)。

## 开源协议

本项目采用 [MIT License](LICENSE)。你可以使用、修改、分发和用于商业用途，并须保留许可证中的版权声明与许可文本。软件按原样提供，不提供担保。

第三方内容保留其原有版权、许可证和署名要求，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
