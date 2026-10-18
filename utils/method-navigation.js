const methods = [
  { id: "yao", label: "六爻" },
  { id: "meihua", label: "梅花" },
  { id: "tarot", label: "塔罗" },
];
function openMethod(event) {
  const id = event.currentTarget.dataset.method;
  if (id === this.data.methodId) return;
  if (id === "yao") {
    wx.removeStorageSync("fortune-pending-record-id");
    wx.setStorageSync("fortune-pending-yao-intent", {
      topicId: "love",
      questionInput: "",
      guideId: "",
    });
    wx.switchTab({ url: "/pages/yao/yao" });
  } else if (id === "meihua" || id === "tarot") {
    const url =
      id === "meihua"
        ? "/pages/meihua/meihua"
        : "/packages/tarot/pages/reading";
    // Redirect between the two secondary pages to avoid accumulating a navigation stack.
    if (this.data.methodId !== "yao") wx.redirectTo({ url });
    else wx.navigateTo({ url });
  }
}
module.exports = { methods, openMethod };
