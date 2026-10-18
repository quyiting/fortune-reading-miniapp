const { deck } = require("./tarot-data");
function buildTarotReading(input, random = Math.random) {
  if (!["one", "three"].includes(input.spread))
    throw new Error("请选择单张或三张牌阵");
  const remaining = deck.slice();
  const labels =
    input.spread === "one" ? ["当下提醒"] : ["现状", "阻碍", "建议"];
  const cards = labels.map((position, i) => {
    const index = Math.min(
      remaining.length - 1,
      Math.floor(random() * remaining.length),
    );
    const card = remaining.splice(index, 1)[0];
    const reversed = random() < 0.5;
    return {
      id: card.id,
      name: card.name,
      theme: card.theme,
      reversed,
      orientation: reversed ? "逆位" : "正位",
      position,
      index: i,
      meaning: reversed ? card.reversed : card.upright,
      image: `/packages/tarot/cards/${card.id}.webp`,
    };
  });
  return {
    schemaVersion: 1,
    engineVersion: "rws-78-project-meanings-1",
    type: "tarot",
    spread: input.spread,
    title: cards.map((c) => c.name).join(" · "),
    subtitle:
      input.spread === "one"
        ? "单张牌 · 当下提醒"
        : "三张牌 · 现状 / 阻碍 / 建议",
    question: String(input.question || "")
      .trim()
      .slice(0, 60),
    summary: cards[0].meaning,
    generatedAt: Date.now(),
    cards,
    sections: cards.map((c) => ({
      title: `${c.position} · ${c.name}（${c.orientation}）`,
      body: c.meaning,
    })),
    ruleNote:
      "从78张牌中不放回抽取，每张牌独立确定正逆位。牌序、朝向和本次基础牌义会一起保存；逆位不代表必然发生坏事。",
    details: [
      {
        label: "牌面来源",
        value:
          "Rider–Waite–Smith 经典牌，Pamela Colman Smith / A. E. Waite，Wikimedia Commons公有领域素材。基础牌义由本项目编写。",
      },
    ],
  };
}
module.exports = { deck, buildTarotReading };
