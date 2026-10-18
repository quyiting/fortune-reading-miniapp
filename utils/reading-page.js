const { confirmHistoryCapacity } = require("./history-capacity");
const {
  addHistory,
  createHistoryEntry,
  getHistoryEntry,
  saveReviewNote,
} = require("./history");
const { fillParagraph } = require("./poster-text");
const readingData = {
  result: null,
  activeRecordId: "",
  recordSaved: false,
  isViewingRecord: false,
  showReadingDetails: false,
  editingReviewId: "",
  reviewNoteDraft: "",
  activeReviewNote: "",
  posterVisible: false,
  posterImage: "",
  isPosterGenerating: false,
};
function readingMethods() {
  return {
    resetReading() {
      this.setData({ ...readingData });
    },
    showReading(result) {
      this.setData({ ...readingData, result });
      this.saveReading();
      wx.pageScrollTo({ scrollTop: 0, duration: 180 });
    },
    saveReading() {
      if (!this.data.result || this.data.recordSaved) return;
      const result = this.data.result;
      try {
        const entry = createHistoryEntry(result.type, {
          title: result.title,
          subtitle: result.subtitle,
          summary: result.summary,
          question: result.question,
          result,
        });
        addHistory(entry);
        this.setData({ activeRecordId: entry.id, recordSaved: true });
      } catch (error) {
        wx.showToast({ title: "本机保存失败，可重试或保存海报", icon: "none" });
      }
    },
    handleRetrySave() {
      if (!this.data.result || this.data.recordSaved) return;
      confirmHistoryCapacity(this, () => this.saveReading());
    },
    restoreReading(id, types) {
      const entry = getHistoryEntry(id);
      if (!entry || !entry.result || !types.includes(entry.type)) {
        wx.showToast({ title: "这条记录没有可回看的完整结果", icon: "none" });
        return false;
      }
      this.setData({
        ...readingData,
        result: entry.result,
        activeRecordId: entry.id,
        recordSaved: true,
        isViewingRecord: true,
        activeReviewNote: entry.reviewNote,
      });
      return true;
    },
    refreshReadingNote() {
      if (!this.data.activeRecordId) return;
      const entry = getHistoryEntry(this.data.activeRecordId);
      this.setData(
        entry
          ? { activeReviewNote: entry.reviewNote }
          : {
              activeRecordId: "",
              recordSaved: false,
              activeReviewNote: "",
              editingReviewId: "",
              reviewNoteDraft: "",
            },
      );
    },
    handleReadingDetails() {
      this.setData({ showReadingDetails: !this.data.showReadingDetails });
    },
    handleNewReading() {
      this.resetReading();
      wx.pageScrollTo({ scrollTop: 0, duration: 180 });
    },
    handleEditReviewNote() {
      const entry = getHistoryEntry(this.data.activeRecordId);
      if (!entry) {
        this.refreshReadingNote();
        wx.showToast({ title: "请先将结果保存到本机", icon: "none" });
        return;
      }
      this.setData({
        editingReviewId: entry.id,
        reviewNoteDraft: entry.reviewNote,
      });
    },
    handleReviewNoteInput(event) {
      this.setData({ reviewNoteDraft: event.detail.value.slice(0, 200) });
    },
    handleCancelReviewNote() {
      this.setData({ editingReviewId: "", reviewNoteDraft: "" });
    },
    handleSaveReviewNote() {
      if (!this.data.editingReviewId) return;
      try {
        const entry = saveReviewNote(
          this.data.editingReviewId,
          this.data.reviewNoteDraft,
        );
        this.handleCancelReviewNote();
        this.refreshReadingNote();
        wx.showToast({
          title: entry ? "备注已保存" : "记录已不在本机",
          icon: "none",
        });
      } catch (error) {
        wx.showToast({ title: "备注保存失败，请重试", icon: "none" });
      }
    },
    handlePosterOpen() {
      if (!this.data.result) return;
      this.setData({ posterVisible: true });
      if (!this.data.posterImage && !this.data.isPosterGenerating)
        this.generatePoster();
    },
    handlePosterClose() {
      this.setData({ posterVisible: false });
    },
    noop() {},
    generatePoster() {
      const result = this.data.result;
      if (!result || this.data.isPosterGenerating) return;
      this.setData({ isPosterGenerating: true });
      const ctx = wx.createCanvasContext("posterCanvas", this);
      ctx.setFillStyle("#f7f7f4");
      ctx.fillRect(0, 0, 620, 1080);
      ctx.setFillStyle("#ffffff");
      ctx.fillRect(24, 24, 572, 1032);
      fillParagraph(ctx, "大可不必算 · 本机留存", 48, 82, {
        color: "#995239",
        fontSize: 22,
      });
      fillParagraph(ctx, result.title, 48, 148, {
        fontSize: 32,
        maxChars: 16,
        maxLines: 2,
        lineHeight: 44,
      });
      let y = 260;
      if (result.question)
        y =
          fillParagraph(ctx, result.question, 48, y, {
            fontSize: 24,
            maxChars: 21,
            maxLines: 3,
          }) + 32;
      y =
        fillParagraph(ctx, result.summary, 48, y, {
          fontSize: 24,
          maxChars: 21,
          maxLines: 4,
        }) + 38;
      if (result.pillars)
        y =
          fillParagraph(
            ctx,
            result.pillars.map((p) => `${p.label} ${p.value}`).join("　"),
            48,
            y,
            { fontSize: 24, maxChars: 21, maxLines: 2 },
          ) + 28;
      for (const section of (result.sections || []).slice(0, 3)) {
        if (y > 850) break;
        y =
          fillParagraph(ctx, section.title, 48, y, {
            fontSize: 22,
            color: "#995239",
            maxChars: 22,
            maxLines: 1,
          }) + 10;
        y =
          fillParagraph(ctx, section.body, 48, y, {
            fontSize: 21,
            maxChars: 23,
            maxLines: 2,
          }) + 26;
      }
      fillParagraph(ctx, "传统文化娱乐与自我探索参考", 48, 1008, {
        fontSize: 18,
        maxChars: 28,
        color: "#6e6a63",
      });
      const valid = () => !this.readingDisposed && this.data.result === result;
      ctx.draw(false, () => {
        if (!valid()) return;
        wx.canvasToTempFilePath(
          {
            canvasId: "posterCanvas",
            width: 620,
            height: 1080,
            destWidth: 1240,
            destHeight: 2160,
            success: ({ tempFilePath }) => {
              if (valid())
                this.setData({
                  isPosterGenerating: false,
                  posterImage: tempFilePath,
                });
            },
            fail: () => {
              if (valid()) {
                this.setData({ isPosterGenerating: false });
                wx.showToast({ title: "海报生成失败，请重试", icon: "none" });
              }
            },
          },
          this,
        );
      });
    },
    savePoster() {
      if (!this.data.posterImage) return;
      wx.saveImageToPhotosAlbum({
        filePath: this.data.posterImage,
        success: () => wx.showToast({ title: "已保存到相册", icon: "success" }),
        fail: () =>
          wx.showToast({ title: "保存失败，请检查相册权限", icon: "none" }),
      });
    },
    onUnload() {
      this.readingDisposed = true;
    },
    onShareAppMessage() {
      return {
        title: "来大可不必算，问一件事，看看自己的节奏",
        path: "/pages/index/index",
      };
    },
  };
}
module.exports = { readingData, readingMethods };
