const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createWx } = require("./helpers/miniprogram");
const meihua = require("../utils/meihua");
const tarot = require("../utils/tarot");
const birth = require("../utils/birth-profile");
const natal = require("../utils/natal");
beforeEach(() => {
  global.wx = createWx();
});
const person = {
  dateType: "solar",
  date: "2000-01-07",
  time: "12:00",
  gender: "male",
  unknownTime: false,
  isLeap: false,
};

test("梅花固定两数和北京时间，正确生成本互变卦及动爻", () => {
  assert.equal(typeof meihua.buildMeihuaReading, "function");
  const r = meihua.buildMeihuaReading(
    { first: 1, second: 1, question: "测试" },
    new Date("2026-10-18T04:00:00Z"),
  );
  assert.equal(r.original.id, "qian-qian");
  assert.equal(r.mutual.id, "qian-qian");
  assert.equal(r.changed.id, "qian-dui");
  assert.equal(r.movingLine, 3);
  assert.equal(r.hourBranch, "午");
  assert.throws(
    () => meihua.buildMeihuaReading({ first: 0, second: 1 }),
    /数字/,
  );
  assert.throws(
    () => meihua.buildMeihuaReading({ first: 1.5, second: 1 }),
    /数字/,
  );
});

test("塔罗包含78张唯一牌，三张抽取不重复且正逆位由同次随机源确定", () => {
  assert.equal(typeof tarot.buildTarotReading, "function");
  assert.equal(tarot.deck.length, 78);
  assert.equal(new Set(tarot.deck.map((c) => c.id)).size, 78);
  const r = tarot.buildTarotReading(
    { spread: "three", question: "测试" },
    () => 0,
  );
  assert.equal(r.cards.length, 3);
  assert.equal(new Set(r.cards.map((c) => c.id)).size, 3);
  assert.ok(
    r.cards.every(
      (c) => c.reversed && c.image.startsWith("/packages/tarot/cards/"),
    ),
  );
  assert.equal(
    tarot.buildTarotReading({ spread: "one" }, () => 0.9).cards.length,
    1,
  );
  assert.throws(() => tarot.buildTarotReading({ spread: "invalid" }), /牌阵/);
});

test("出生资料校验真实日期和闰月，只有明确同意时保存并可删除", () => {
  assert.equal(typeof birth.normalizeBirthInput, "function");
  assert.throws(
    () => birth.normalizeBirthInput({ ...person, date: "2000-02-30" }),
    /日期/,
  );
  assert.throws(
    () => birth.normalizeBirthInput({ ...person, time: "24:00" }),
    /时间/,
  );
  assert.throws(
    () =>
      birth.normalizeBirthInput({
        ...person,
        dateType: "lunar",
        date: "2000-04-01",
        isLeap: true,
      }),
    /闰月/,
  );
  const leap = birth.normalizeBirthInput({
    ...person,
    dateType: "lunar",
    date: "2023-02-01",
    isLeap: true,
  });
  assert.equal(leap.solarDate, "2023-03-22");
  birth.saveBirthProfile(person, false);
  assert.equal(birth.getBirthProfile(), null);
  birth.saveBirthProfile(person, true);
  assert.equal(birth.getBirthProfile().date, person.date);
  birth.saveBirthProfile(person, false);
  assert.equal(birth.getBirthProfile(), null);
});

test("八字采用节气柱、零点换日；已知时刻显示四柱和大运", () => {
  assert.equal(typeof natal.buildBaziReading, "function");
  const r = natal.buildBaziReading(person);
  assert.equal(r.pillars.map((p) => p.value).join(" "), "己卯 丁丑 甲子 庚午");
  assert.equal(
    r.elements.reduce((n, x) => n + x.count, 0),
    8,
  );
  assert.ok(r.cycles.length >= 8);
  const late = natal.buildBaziReading({ ...person, time: "23:30" });
  assert.equal(late.pillars[2].value, "甲子");
  const next = natal.buildBaziReading({
    ...person,
    date: "2000-01-08",
    time: "00:00",
  });
  assert.equal(next.pillars[2].value, "乙丑");
});

test("未知时刻八字仅三柱且无起运，紫微拒绝排盘", () => {
  assert.equal(typeof natal.buildBaziReading, "function");
  const input = { ...person, unknownTime: true, time: "" };
  const r = natal.buildBaziReading(input);
  assert.equal(r.pillars.length, 3);
  assert.equal(r.cycles.length, 0);
  assert.match(r.ruleNote, /未知/);
  assert.throws(() => natal.buildZiweiReading(input), /时/);
});

test("紫微完整十二宫、命身宫和四化，序列化后可原样回看", () => {
  assert.equal(typeof natal.buildZiweiReading, "function");
  const r = natal.buildZiweiReading(person);
  assert.equal(r.palaces.length, 12);
  assert.equal(new Set(r.palaces.map((p) => p.name)).size, 12);
  assert.ok(r.palaces.some((p) => p.name === "命宫"));
  assert.equal(
    r.palaces.reduce((n, p) => n + p.majorStars.length, 0),
    14,
  );
  assert.deepEqual(JSON.parse(JSON.stringify(r)).palaces, r.palaces);
  assert.equal(
    natal.buildZiweiReading({ ...person, time: "23:30" }).timeIndex,
    12,
  );
});

test("八字年、月在立春交接前后切换，不按公历元旦切换", () => {
  const before = natal.buildBaziReading({ ...person, date: "2000-02-04", time: "20:40" });
  const after = natal.buildBaziReading({ ...person, date: "2000-02-04", time: "20:41" });
  assert.deepEqual(before.pillars.slice(0, 2).map(p => p.value), ["己卯", "丁丑"]);
  assert.deepEqual(after.pillars.slice(0, 2).map(p => p.value), ["庚辰", "戊寅"]);
});
