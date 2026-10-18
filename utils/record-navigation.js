const { getHistoryEntry } = require("./history");

const PENDING_RECORD_KEY = "fortune-pending-record-id";

function openRecord(recordId) {
  const entry = getHistoryEntry(recordId);

  if (!entry) {
    wx.showToast({ title: "这条记录已不在本机", icon: "none" });
    return;
  }

  if (!entry.result || !["draw", "yao", "meihua", "tarot", "bazi", "ziwei"].includes(entry.type)) {
    wx.showToast({ title: "这条旧记录仅保存了摘要", icon: "none" });
    return;
  }

  if (entry.type === "draw") {
    wx.navigateTo({ url: `/pages/draw/draw?recordId=${encodeURIComponent(entry.id)}` });
    return;
  }

  if (["meihua", "tarot"].includes(entry.type)) {
    const path = entry.type === "tarot" ? "/packages/tarot/pages/reading" : "/pages/meihua/meihua";
    wx.navigateTo({ url: `${path}?recordId=${encodeURIComponent(entry.id)}` });
    return;
  }
  if (["bazi", "ziwei"].includes(entry.type)) {
    const key = "fortune-pending-natal-record-id";
    wx.setStorageSync(key, entry.id);
    wx.switchTab({ url: "/pages/natal/natal", fail: () => wx.removeStorageSync(key) });
    return;
  }

  wx.removeStorageSync("fortune-pending-yao-intent");
  wx.setStorageSync(PENDING_RECORD_KEY, entry.id);
  wx.switchTab({
    url: "/pages/yao/yao",
    fail: () => wx.removeStorageSync(PENDING_RECORD_KEY),
  });
}

module.exports = { openRecord, PENDING_RECORD_KEY };
