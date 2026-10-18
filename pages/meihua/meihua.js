const { buildMeihuaReading } = require("../../utils/meihua");
const { readingData, readingMethods } = require("../../utils/reading-page");
const { confirmHistoryCapacity } = require("../../utils/history-capacity");
const { methods, openMethod } = require("../../utils/method-navigation");
Page({
  data: {
    ...readingData,
    methodId: "meihua",
    methods,
    first: "",
    second: "",
    questionInput: "",
  },
  ...readingMethods(),
  handleOpenMethod: openMethod,
  onLoad(options = {}) {
    if (options.recordId) this.restoreReading(options.recordId, ["meihua"]);
  },
  onShow() {
    this.refreshReadingNote();
  },
  handleQuestionInput(e) {
    this.setData({ questionInput: e.detail.value.slice(0, 60) });
  },
  handleNumberInput(e) {
    const field = e.currentTarget.dataset.field;
    if (field === "first" || field === "second")
      this.setData({ [field]: e.detail.value });
  },
  handleGenerate() {
    let result;
    try {
      result = buildMeihuaReading({
        first: this.data.first,
        second: this.data.second,
        question: this.data.questionInput,
      });
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
      return;
    }
    confirmHistoryCapacity(this, () => this.showReading(result));
  },
});
