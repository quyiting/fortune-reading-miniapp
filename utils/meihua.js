const { trigramMap, hexagramMap } = require("./yao-data");
const { getHexagramKnowledge } = require("./hexagram-knowledge");
const order = ["111", "110", "101", "100", "011", "010", "001", "000"];
const branches = "子丑寅卯辰巳午未申酉戌亥";
const generates = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const controls = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
function describe(bits) {
  const lower = trigramMap[bits.slice(0, 3).join("")];
  const upper = trigramMap[bits.slice(3).join("")];
  const id = `${upper.id}-${lower.id}`;
  return {
    id,
    title: hexagramMap[id].title,
    ...getHexagramKnowledge(id),
    upper,
    lower,
    lines: bits
      .map((value, i) => ({ position: i + 1, isYang: value === 1 }))
      .reverse(),
  };
}
function buildMeihuaReading(input, date = new Date()) {
  const first = Number(input.first),
    second = Number(input.second);
  if (![first, second].every((n) => Number.isInteger(n) && n >= 1 && n <= 999))
    throw new Error("请输入1—999之间的两个整数数字");
  const beijing = new Date(date.getTime() + 8 * 3600000);
  const hourIndex = Math.floor((beijing.getUTCHours() + 1) / 2) % 12;
  const movingLine = (first + second + hourIndex + 1) % 6 || 6;
  const upperBits = order[(first - 1) % 8],
    lowerBits = order[(second - 1) % 8];
  const bits = (lowerBits + upperBits).split("").map(Number);
  const changedBits = bits.map((bit, i) =>
    i === movingLine - 1 ? 1 - bit : bit,
  );
  const original = describe(bits),
    changed = describe(changedBits);
  const mutual = describe(bits.slice(1, 4).concat(bits.slice(2, 5)));
  original.kind = "本卦";
  mutual.kind = "互卦";
  changed.kind = "变卦";
  const body = movingLine <= 3 ? original.upper : original.lower;
  const use = movingLine <= 3 ? original.lower : original.upper;
  let relation = "体用比和：先协调内外节奏，再做小步尝试。";
  if (generates[use.element] === body.element)
    relation = "用生体：可以留意外部支持，但仍需核实实际条件。";
  else if (generates[body.element] === use.element)
    relation = "体生用：可能需要先付出精力，注意投入边界。";
  else if (controls[use.element] === body.element)
    relation = "用克体：先辨认外部限制，准备备选方案。";
  else if (controls[body.element] === use.element)
    relation = "体克用：可主动梳理事情，但避免用力过度。";
  const pad = (n) => String(n).padStart(2, "0");
  const generatedLabel = `${beijing.getUTCFullYear()}-${pad(beijing.getUTCMonth() + 1)}-${pad(beijing.getUTCDate())} ${pad(beijing.getUTCHours())}:${pad(beijing.getUTCMinutes())}`;
  return {
    schemaVersion: 1,
    engineVersion: "meihua-numbers-1",
    type: "meihua",
    title: original.title,
    subtitle: `${original.title}之${changed.title} · ${movingLine}爻动`,
    question: String(input.question || "")
      .trim()
      .slice(0, 60),
    summary: original.plainMeaning,
    original,
    changed,
    mutual,
    movingLine,
    first,
    second,
    hourBranch: branches[hourIndex],
    hourIndex: hourIndex + 1,
    generatedLabel,
    bodyLabel: `${body.name} · ${body.element}`,
    useLabel: `${use.name} · ${use.element}`,
    ruleNote:
      "数字起卦变体：第一数÷8余数定上卦，第二数÷8余数定下卦（余0取8）；两数加北京时间时支序号÷6余数定动爻（余0取6）。未作真太阳时校正。",
    sections: [
      { title: "卦象提示", body: original.plainMeaning },
      { title: "体用参考", body: relation },
      {
        title: "互卦与变卦",
        body: `互卦${mutual.title}：${mutual.plainMeaning} 变卦${changed.title}：${changed.plainMeaning}`,
      },
    ],
    details: [
      { label: "原始数字", value: `${first} / ${second}` },
      {
        label: "起卦时间 UTC+8",
        value: `${generatedLabel} · ${branches[hourIndex]}时（序号${hourIndex + 1}）`,
      },
      {
        label: "动爻计算",
        value: `(${first} + ${second} + ${hourIndex + 1}) ÷ 6，余数 ${movingLine === 6 ? 0 : movingLine}，取第${movingLine}爻`,
      },
      { label: "《周易》卦辞", value: original.guaCi },
    ],
  };
}
module.exports = { buildMeihuaReading };
