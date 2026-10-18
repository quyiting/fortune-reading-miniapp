const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createWx, loadPage } = require("./helpers/miniprogram");
const {
  getHistory,
  getHistoryEntry,
  createHistoryEntry,
  addHistory,
} = require("../utils/history");
const { openRecord } = require("../utils/record-navigation");
const tap = (dataset) => ({ currentTarget: { dataset } });
beforeEach(() => {
  global.wx = createWx();
});
test("梅花保存完整结果，重开不会重新计算或追加历史", () => {
  const p = loadPage("pages/meihua/meihua.js");
  p.setData({ first: "1", second: "1", questionInput: "计划" });
  p.handleGenerate();
  const saved = getHistory()[0];
  assert.equal(saved.type, "meihua");
  openRecord(saved.id);
  assert.match(wx.navigation.at(-1), /pages\/meihua\/meihua\?recordId=/);
  const reopened = loadPage("pages/meihua/meihua.js");
  reopened.onLoad({ recordId: saved.id });
  assert.equal(
    JSON.stringify(reopened.data.result),
    JSON.stringify(saved.result),
  );
  assert.equal(getHistory().length, 1);
});
test("塔罗全部翻牌后仅保存一次，回看保留牌序和正逆位", () => {
  const p = loadPage("packages/tarot/pages/reading.js");
  p.handleDraw();
  assert.equal(getHistory().length, 0);
  p.handleFlip(tap({ index: 0 }));
  p.handleFlip(tap({ index: 0 }));
  assert.equal(getHistory().length, 0);
  p.handleFlip(tap({ index: 1 }));
  p.handleFlip(tap({ index: 2 }));
  p.handleFlip(tap({ index: 2 }));
  assert.equal(getHistory().length, 1);
  const saved = getHistory()[0];
  openRecord(saved.id);
  assert.match(wx.navigation.at(-1), /packages\/tarot\/pages\/reading/);
  const r = loadPage("packages/tarot/pages/reading.js");
  r.onLoad({ recordId: saved.id });
  assert.equal(
    JSON.stringify(r.data.result.cards),
    JSON.stringify(saved.result.cards),
  );
});
test("命盘按用户同意保存共用出生资料，回看原盘，删除资料不删历史", () => {
  const p = loadPage("pages/natal/natal.js");
  p.onShow();
  p.setData({
    birthDate: "2000-01-07",
    birthTime: "12:00",
    genderIndex: 0,
    saveProfile: true,
  });
  p.handleGenerate();
  assert.equal(getHistory()[0].type, "bazi");
  assert.ok(wx.getStorageSync("fortune-birth-profile"));
  const q = loadPage("pages/natal/natal.js");
  q.onShow();
  assert.equal(q.data.birthDate, "2000-01-07");
  const saved = getHistory()[0];
  openRecord(saved.id);
  q.onShow();
  assert.equal(q.data.result.title, saved.result.title);
  assert.equal(getHistory().length, 1);
  q.handleDeleteProfile();
  wx.answerModal(true);
  assert.equal(wx.getStorageSync("fortune-birth-profile"), "");
  assert.equal(getHistory().length, 1);
});
test("新体系记录可写备注，保留原结果与创建时间", () => {
  const p = loadPage("pages/meihua/meihua.js");
  p.setData({ first: "5", second: "7" });
  p.handleGenerate();
  const saved = getHistory()[0];
  const profile = loadPage("pages/profile/profile.js");
  profile.onShow();
  profile.handleEditReviewNote(tap({ id: saved.id }));
  profile.handleReviewNoteInput({ detail: { value: "后来已经沟通过" } });
  profile.handleSaveReviewNote();
  const updated = getHistoryEntry(saved.id);
  assert.equal(updated.reviewNote, "后来已经沟通过");
  assert.deepEqual(updated.result, saved.result);
  assert.equal(updated.createdAt, saved.createdAt);
});
test("满额取消生成不会写出生资料或覆盖旧记录", () => {
  for (let i = 0; i < 20; i++)
    addHistory(createHistoryEntry("draw", { title: "旧签" + i }));
  const p = loadPage("pages/natal/natal.js");
  p.setData({
    birthDate: "2000-01-07",
    birthTime: "12:00",
    genderIndex: 0,
    saveProfile: true,
  });
  p.handleGenerate();
  wx.answerModal(false);
  assert.equal(getHistory().length, 20);
  assert.equal(wx.getStorageSync("fortune-birth-profile"), "");
  assert.equal(p.data.result, null);
});
test("保存失败仍展示完整结果并可生成海报", () => {
  const p = loadPage("pages/meihua/meihua.js");
  p.setData({ first: "2", second: "8" });
  wx.setStorageSync = () => {
    throw Error("full");
  };
  p.handleGenerate();
  assert.ok(p.data.result);
  assert.equal(p.data.recordSaved, false);
  assert.match(wx.notices.at(-1), /保存失败/);
  p.handlePosterOpen();
  assert.ok(p.data.posterImage);
  assert.ok(wx.paintedTexts.includes(p.data.result.title));
});

test("新体系海报的旧异步回调不能覆盖新结果", () => {
  const p = loadPage("pages/meihua/meihua.js");
  p.setData({ first: "1", second: "1" });
  p.handleGenerate();
  let exportOptions;
  wx.canvasToTempFilePath = (options) => {
    exportOptions = options;
  };
  p.handlePosterOpen();
  p.handleNewReading();
  p.setData({ first: "2", second: "4" });
  p.handleGenerate();
  exportOptions.success({ tempFilePath: "/tmp/old.png" });
  assert.equal(p.data.posterImage, "");
  assert.equal(p.data.isPosterGenerating, false);
});
test("结果重新保存遇到满额时先确认，取消不替换记录", () => {
  const p = loadPage("pages/meihua/meihua.js");
  p.setData({ first: "1", second: "2" });
  p.handleGenerate();
  const id = p.data.activeRecordId;
  require("../utils/history").deleteHistoryEntry(id);
  p.onShow();
  for (let i = 0; i < 20; i++)
    addHistory(createHistoryEntry("draw", { title: "签" + i }));
  p.handleRetrySave();
  assert.equal(wx.modals.length, 1);
  wx.answerModal(false);
  assert.equal(p.data.recordSaved, false);
  assert.equal(getHistory().length, 20);
});
test("农历三十不受公历日期选择器约束，保存共用资料时保留农历输入", () => {
  const p = loadPage("pages/natal/natal.js");
  p.setData({
    dateType: "lunar",
    lunarYear: "2000",
    lunarMonth: "1",
    lunarDay: "30",
    unknownTime: true,
    genderIndex: 1,
    saveProfile: true,
  });
  p.handleGenerate();
  assert.equal(p.data.result.birth.date, "2000-01-30");
  assert.equal(p.data.result.pillars.length, 3);
  assert.equal(wx.getStorageSync("fortune-birth-profile").dateType, "lunar");
});
