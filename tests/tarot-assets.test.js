const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { deck, buildTarotReading } = require("../utils/tarot");
const { createWx, loadPage } = require("./helpers/miniprogram");

test("78张离线牌面均使用JPEG并与素材清单匹配，分包保持2MB以内", () => {
  const manifest = require("../packages/tarot/ASSET_SOURCES.json");
  assert.equal(manifest.cards.length, 78);
  for (const card of deck) {
    const asset = manifest.cards.find(item => item.id === card.id);
    assert.equal(asset.file, `${card.id}.jpg`);
    const image = fs.readFileSync(path.join(__dirname, "../packages/tarot/cards", asset.file));
    assert.equal(image.subarray(0, 3).toString("hex"), "ffd8ff");
    assert.equal(crypto.createHash("sha256").update(image).digest("hex"), asset.sha256);
  }
  const bytes = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const file = path.join(dir, entry.name);
    return total + (entry.isDirectory() ? bytes(file) : fs.statSync(file).size);
  }, 0);
  assert.ok(bytes(path.join(__dirname, "../packages/tarot")) < 2 * 1024 * 1024);
  assert.ok(buildTarotReading({ spread: "three" }).cards.every(card => card.image.endsWith(".jpg")));
});

test("旧WebP快照回看使用JPEG显示映射，原牌序、正逆位和存储快照不变", () => {
  global.wx = createWx();
  const { addHistory, createHistoryEntry, getHistoryEntry } = require("../utils/history");
  const result = buildTarotReading({ spread: "three" }, () => 0);
  result.cards.forEach(card => { card.image = `/packages/tarot/cards/${card.id}.webp`; });
  const entry = createHistoryEntry("tarot", { title: result.title, result });
  addHistory(entry);
  const page = loadPage("packages/tarot/pages/reading.js");
  page.onLoad({ recordId: entry.id });
  for (const card of page.data.result.cards) {
    assert.equal(page.data.tarotCardImages && page.data.tarotCardImages[card.id], `/packages/tarot/cards/${card.id}.jpg`);
  }
  assert.equal(JSON.stringify(getHistoryEntry(entry.id).result), JSON.stringify(result));
  assert.equal(JSON.stringify(page.data.result.cards), JSON.stringify(result.cards));
});
