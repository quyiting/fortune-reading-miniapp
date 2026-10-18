const { buildBaziReading, buildZiweiReading } = require("../../utils/natal");
const {
  getBirthProfile,
  saveBirthProfile,
  clearBirthProfile,
  normalizeBirthInput,
} = require("../../utils/birth-profile");
const { readingData, readingMethods } = require("../../utils/reading-page");
const { confirmHistoryCapacity } = require("../../utils/history-capacity");
const PENDING_KEY = "fortune-pending-natal-record-id";
Page({
  data: {
    ...readingData,
    systemId: "bazi",
    dateType: "solar",
    birthDate: "",
    birthTime: "",
    unknownTime: false,
    isLeap: false,
    lunarYear: "",
    lunarMonth: "",
    lunarDay: "",
    showRules: false,
    genderIndex: -1,
    genders: ["男", "女"],
    saveProfile: false,
    hasSavedProfile: false,
    profileNotice: "",
  },
  ...readingMethods(),
  onShow() {
    const id = wx.getStorageSync(PENDING_KEY);
    if (id) {
      wx.removeStorageSync(PENDING_KEY);
      if (this.restoreReading(id, ["bazi", "ziwei"])) {
        this.formInitialized = true;
        const r = this.data.result;
        this.setData({ systemId: r.type });
        this.applyBirth(r.birth, false);
      }
      return;
    }
    if (!this.formInitialized) {
      const profile = getBirthProfile();
      if (profile) this.applyBirth(profile, true);
      this.formInitialized = true;
    }
    this.setData({ hasSavedProfile: !!getBirthProfile() });
    this.refreshReadingNote();
  },
  applyBirth(p, saved) {
    const [lunarYear, lunarMonth, lunarDay] = p.date.split("-");
    this.setData({
      lunarYear,
      lunarMonth,
      lunarDay,
      dateType: p.dateType,
      birthDate: p.date,
      birthTime: p.time || "",
      genderIndex: p.gender === "male" ? 0 : 1,
      unknownTime: p.unknownTime,
      isLeap: p.isLeap,
      saveProfile: saved,
      hasSavedProfile: !!getBirthProfile(),
    });
  },
  handleSystem(e) {
    const id = e.currentTarget.dataset.system;
    if (id === "bazi" || id === "ziwei") {
      this.resetReading();
      this.setData({ systemId: id });
    }
  },
  handleDateType(e) {
    const type = e.currentTarget.dataset.type;
    if (type === "solar" || type === "lunar")
      this.setData({ dateType: type, birthDate: "", isLeap: false });
  },
  handleRulesToggle() {
    this.setData({ showRules: !this.data.showRules });
  },
  handleLunarPart(e) {
    const part = e.currentTarget.dataset.part;
    if (["lunarYear", "lunarMonth", "lunarDay"].includes(part))
      this.setData({ [part]: e.detail.value });
  },
  handleDate(e) {
    this.setData({ birthDate: e.detail.value });
  },
  handleTime(e) {
    this.setData({ birthTime: e.detail.value });
  },
  handleGender(e) {
    this.setData({ genderIndex: Number(e.detail.value) });
  },
  handleUnknown(e) {
    this.setData({ unknownTime: e.detail.value });
  },
  handleLeap(e) {
    this.setData({ isLeap: e.detail.value });
  },
  handleSaveProfile(e) {
    this.setData({ saveProfile: e.detail.value });
  },
  handleGenerate() {
    const d = this.data;
    const input = {
      dateType: d.dateType,
      date:
        d.dateType === "lunar"
          ? `${d.lunarYear}-${String(d.lunarMonth).padStart(2, "0")}-${String(d.lunarDay).padStart(2, "0")}`
          : d.birthDate,
      time: d.birthTime,
      gender:
        d.genderIndex === 0 ? "male" : d.genderIndex === 1 ? "female" : "",
      unknownTime: d.unknownTime,
      isLeap: d.isLeap,
    };
    let result;
    try {
      normalizeBirthInput(input);
      result =
        d.systemId === "bazi"
          ? buildBaziReading(input)
          : buildZiweiReading(input);
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
      return;
    }
    confirmHistoryCapacity(this, () => {
      this.showReading(result);
      try {
        saveBirthProfile(input, this.data.saveProfile);
        this.setData({
          hasSavedProfile: !!getBirthProfile(),
          profileNotice: "",
        });
      } catch (error) {
        this.setData({ profileNotice: "出生资料保存失败，本次结果仍可阅读。" });
        wx.showToast({ title: "出生资料保存失败", icon: "none" });
      }
    });
  },
  handleDeleteProfile() {
    wx.showModal({
      title: "删除本机出生资料？",
      content:
        "删除后不再自动填入。已生成的命盘记录包含当时出生信息，可另在记录页删除。",
      confirmText: "删除资料",
      success: ({ confirm }) => {
        if (!confirm) return;
        try {
          clearBirthProfile();
          this.setData({
            birthDate: "",
            birthTime: "",
            lunarYear: "",
            lunarMonth: "",
            lunarDay: "",
            genderIndex: -1,
            unknownTime: false,
            isLeap: false,
            saveProfile: false,
            hasSavedProfile: false,
          });
          wx.showToast({ title: "出生资料已删除", icon: "none" });
        } catch (error) {
          wx.showToast({ title: "删除失败，请重试", icon: "none" });
        }
      },
    });
  },
});
