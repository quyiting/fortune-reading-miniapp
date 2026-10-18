const { buildTarotReading, tarotCardImages } = require("../../../utils/tarot");
const { readingData, readingMethods } = require("../../../utils/reading-page");
const { confirmHistoryCapacity } = require("../../../utils/history-capacity");
const { methods, openMethod } = require("../../../utils/method-navigation");
Page({
  data: {
    ...readingData,
    // Resolve images for old WebP snapshots without rewriting their saved result.
    tarotCardImages,
    methodId: "tarot",
    methods,
    spread: "three",
    questionInput: "",
    drawnCards: [],
  },
  ...readingMethods(),
  handleOpenMethod: openMethod,
  onLoad(options = {}) {
    if (options.recordId) this.restoreReading(options.recordId, ["tarot"]);
  },
  onShow() {
    this.refreshReadingNote();
  },
  handleQuestionInput(e) {
    this.setData({ questionInput: e.detail.value.slice(0, 60) });
  },
  handleSpread(e) {
    if (
      !this.pendingReading &&
      !this.data.result &&
      ["one", "three"].includes(e.currentTarget.dataset.spread)
    )
      this.setData({ spread: e.currentTarget.dataset.spread });
  },
  handleDraw() {
    if (this.pendingReading || this.data.result) return;
    confirmHistoryCapacity(this, () => {
      this.pendingReading = buildTarotReading({
        spread: this.data.spread,
        question: this.data.questionInput,
      });
      this.setData({
        drawnCards: this.pendingReading.cards.map((c) => ({
          ...c,
          revealed: false,
        })),
      });
    });
  },
  handleFlip(e) {
    if (!this.pendingReading || this.data.result) return;
    const index = Number(e.currentTarget.dataset.index);
    const cards = this.data.drawnCards.map((c, i) =>
      i === index ? { ...c, revealed: true } : c,
    );
    this.setData({ drawnCards: cards });
    if (cards.every((c) => c.revealed)) {
      const result = this.pendingReading;
      this.pendingReading = null;
      this.showReading(result);
    }
  },
  handleNewReading() {
    this.pendingReading = null;
    this.resetReading();
    this.setData({ drawnCards: [] });
    wx.pageScrollTo({ scrollTop: 0, duration: 180 });
  },
});
