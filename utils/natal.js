const { Solar } = require("../vendor/lunar");
const { astro } = require("../vendor/iztro");
const { normalizeBirthInput } = require("./birth-profile");
const TIME_RULE =
  "北京时间 UTC+8，按输入的标准时排盘，不作真太阳时和历史夏令时自动校正。";
const elementMeaning = {
  木: "生长与规划",
  火: "表达与热情",
  土: "承接与稳定",
  金: "秩序与判断",
  水: "流动与观察",
};
const starThemes = {
  紫微: "统筹与承担",
  天机: "思考与调整",
  太阳: "表达与付出",
  武曲: "执行与资源管理",
  天同: "安稳与感受",
  廉贞: "边界与原则",
  天府: "积累与协调",
  太阴: "细致与照顾",
  贪狼: "探索与欲望",
  巨门: "辨析与沟通",
  天相: "协作与平衡",
  天梁: "保护与经验",
  七杀: "行动与突破",
  破军: "改变与重建",
};
function base(type, birth, version) {
  return {
    schemaVersion: 1,
    type,
    engineVersion: version,
    birth,
    title: type === "bazi" ? "八字命盘" : "紫微命盘",
    subtitle: `${birth.solarDate} ${birth.time || "时刻未知"} · 北京时间`,
    generatedAt: Date.now(),
    question: "",
    details: [
      {
        label: "输入日期",
        value: `${birth.dateType === "lunar" ? "农历" : "公历"}${birth.isLeap ? "闰月 " : " "}${birth.date}`,
      },
      { label: "时间规则", value: TIME_RULE },
    ],
  };
}
function buildBaziReading(input) {
  const birth = normalizeBirthInput(input);
  const lunar = Solar.fromYmdHms(
    birth.year,
    birth.month,
    birth.day,
    birth.hour === null ? 12 : birth.hour,
    birth.minute || 0,
    0,
  ).getLunar();
  const eight = lunar.getEightChar();
  eight.setSect(2);
  const keys = birth.unknownTime
    ? ["Year", "Month", "Day"]
    : ["Year", "Month", "Day", "Time"];
  const labels = ["年柱", "月柱", "日柱", "时柱"];
  const pillars = keys.map((key, i) => ({
    label: labels[i],
    value: eight[`get${key}`](),
    gan: eight[`get${key}Gan`](),
    zhi: eight[`get${key}Zhi`](),
    element: eight[`get${key}WuXing`](),
    hidden: eight[`get${key}HideGan`]().join("、"),
    tenGod: key === "Day" ? "日主" : eight[`get${key}ShiShenGan`](),
    hiddenGods: eight[`get${key}ShiShenZhi`]().join("、"),
    naYin: eight[`get${key}NaYin`](),
  }));
  const elements = Object.keys(elementMeaning).map((name) => ({
    name,
    count: pillars.reduce(
      (n, p) => n + p.element.split("").filter((e) => e === name).length,
      0,
    ),
    meaning: elementMeaning[name],
  }));
  let cycles = [],
    startDate = "";
  if (!birth.unknownTime) {
    const yun = eight.getYun(birth.gender === "male" ? 1 : 0, 2);
    startDate = yun.getStartSolar().toYmd();
    cycles = yun
      .getDaYun(9)
      .slice(1)
      .map((d) => ({
        value: d.getGanZhi(),
        startYear: d.getStartYear(),
        endYear: d.getEndYear(),
        startAge: d.getStartAge(),
      }));
  }
  const dayMaster = eight.getDayGan();
  const ruleNote =
    TIME_RULE +
    " 年、月以节气划分，日柱零点换日（sect=2），时辰按输入时刻。" +
    (birth.unknownTime
      ? "出生时刻未知，三柱按当日12:00作参考；节气交接日的年/月柱仍需补充时刻核对，不计算时柱及起运。"
      : "起运采用 lunar 算法2，具体起运时间单列。");
  return {
    ...base("bazi", birth, "lunar-javascript@1.7.7;sect=2;yun=2"),
    pillars,
    elements,
    cycles,
    startDate,
    dayMaster,
    ruleNote,
    summary: `日主${dayMaster}，${birth.unknownTime ? "当前展示三柱参考" : "四柱已排出"}。五行数量是字面分布，不等同于旺衰或喜用神。`,
    sections: [
      {
        title: "如何读这张盘",
        body: `日主为${dayMaster}，其余天干十神以日主为参照。年、月、日、时柱和藏干分别列出，适合先对照自己的经历，不据此下确定的人生判断。`,
      },
      {
        title: "五行分布",
        body:
          elements.map((e) => `${e.name}${e.count}`).join("、") +
          "。这里仅统计天干与地支本气，不计藏干权重、月令及刑冲合化，不能直接据数量判断缺什么就补什么。",
      },
    ],
    details: base("bazi", birth, "").details.concat([
      { label: "换日与起运", value: ruleNote },
      ...(startDate ? [{ label: "起运日期", value: startDate }] : []),
    ]),
  };
}
function buildZiweiReading(input) {
  const birth = normalizeBirthInput(input);
  if (birth.unknownTime) throw new Error("紫微排盘需要出生时刻，请先补充时辰");
  const timeIndex = birth.hour === 23 ? 12 : Math.floor((birth.hour + 1) / 2);
  const config = {
    yearDivide: "normal",
    horoscopeDivide: "normal",
    ageDivide: "normal",
    dayDivide: "current",
    algorithm: "default",
  };
  const chart = astro.withOptions({
    type: "solar",
    dateStr: birth.solarDate,
    timeIndex,
    gender: birth.gender === "male" ? "男" : "女",
    fixLeap: true,
    language: "zh-CN",
    config,
  });
  const positions = [
    [4, 1],
    [3, 1],
    [2, 1],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4],
    [4, 3],
    [4, 2],
  ];
  const palaces = chart.palaces.map((p, i) => ({
    index: i,
    name: p.name,
    isBody: p.isBodyPalace,
    stemBranch: p.heavenlyStem + p.earthlyBranch,
    majorStars: p.majorStars.map((s) => ({
      name: s.name,
      brightness: s.brightness || "",
      mutagen: s.mutagen || "",
    })),
    minorStars: p.minorStars.map((s) => ({
      name: s.name,
      brightness: s.brightness || "",
      mutagen: s.mutagen || "",
    })),
    adjectiveStars: p.adjectiveStars.map((s) => s.name),
    decadal: p.decadal.range.join("—") + "虚岁",
    starLabel:
      p.majorStars
        .map((s) => s.name + (s.mutagen ? "化" + s.mutagen : ""))
        .join("、") || "无主星",
    row: positions[i][0],
    column: positions[i][1],
  }));
  const focus = ["命宫", "官禄", "财帛", "夫妻"].map((name) => {
    const p = palaces.find((x) => x.name === name);
    const themes = p.majorStars
      .map((s) => starThemes[s.name] || s.name)
      .join("、");
    return {
      title: `${name} · ${p.starLabel}`,
      body: themes
        ? `这些主星常用来讨论${themes}。结合宫位语境观察自己的经验，不能单凭这一宫判断结果。`
        : "此宫无主星，需结合对宫及三方四正阅读，不代表这一领域没有发展。",
    };
  });
  return {
    ...base("ziwei", birth, "iztro@2.6.3;default;current"),
    palaces,
    timeIndex,
    config,
    fiveElementsClass: chart.fiveElementsClass,
    soul: chart.soul,
    body: chart.body,
    lunarDate: chart.lunarDate,
    ruleNote:
      TIME_RULE +
      " 农历年界，零点换日（晚子时按当日），闰月先由历法转换为公历；紫微内置闰月中分规则（fixLeap=true）。十二宫以寅宫起固定地支位置展示。",
    summary: `${chart.fiveElementsClass}，命主${chart.soul}，身主${chart.body}。先看命宫与所关心的宫位，再展开完整星曜。`,
    sections: focus,
    details: base("ziwei", birth, "").details.concat([
      { label: "农历日期", value: chart.lunarDate },
      { label: "命主 / 身主", value: `${chart.soul} / ${chart.body}` },
    ]),
  };
}
module.exports = { buildBaziReading, buildZiweiReading };
