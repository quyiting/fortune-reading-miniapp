const { Solar, Lunar, LunarMonth } = require("../vendor/lunar");
const STORAGE_KEY = "fortune-birth-profile";
function normalizeBirthInput(source = {}) {
  if (!["solar", "lunar"].includes(source.dateType))
    throw new Error("请选择公历或农历");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source.date || ""))
    throw new Error("请选择完整出生日期");
  const [year, month, day] = source.date.split("-").map(Number);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1)
    throw new Error("出生日期需在1900—2100年之间");
  if (!["male", "female"].includes(source.gender))
    throw new Error("请选择排盘性别");
  const unknownTime = source.unknownTime === true;
  const time = unknownTime ? "" : source.time;
  if (
    !unknownTime &&
    (!/^\d{2}:\d{2}$/.test(time || "") ||
      Number(time.slice(0, 2)) > 23 ||
      Number(time.slice(3)) > 59)
  )
    throw new Error("请输入有效出生时间");
  const isLeap = source.dateType === "lunar" && source.isLeap === true;
  let solar;
  if (source.dateType === "lunar") {
    const lunarMonth = LunarMonth.fromYm(year, isLeap ? -month : month);
    if (!lunarMonth)
      throw new Error(isLeap ? "该年没有所选闰月" : "农历日期无效");
    if (day > lunarMonth.getDayCount())
      throw new Error("该农历月份没有这一天，请核对日期");
    solar = Lunar.fromYmd(year, isLeap ? -month : month, day).getSolar();
  } else {
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (day > days) throw new Error("出生日期不存在，请核对日期");
    solar = Solar.fromYmd(year, month, day);
  }
  return {
    dateType: source.dateType,
    date: source.date,
    time,
    gender: source.gender,
    isLeap,
    unknownTime,
    solarDate: solar.toYmd(),
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay(),
    hour: unknownTime ? null : Number(time.slice(0, 2)),
    minute: unknownTime ? null : Number(time.slice(3)),
    timezone: "UTC+8",
    trueSolarTime: false,
  };
}
function getBirthProfile() {
  const raw = wx.getStorageSync(STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeBirthInput(raw);
  } catch (error) {
    return null;
  }
}
function saveBirthProfile(input, consent) {
  if (!consent) {
    wx.removeStorageSync(STORAGE_KEY);
    return;
  }
  const p = normalizeBirthInput(input);
  wx.setStorageSync(STORAGE_KEY, {
    dateType: p.dateType,
    date: p.date,
    time: p.time,
    gender: p.gender,
    isLeap: p.isLeap,
    unknownTime: p.unknownTime,
  });
}
function clearBirthProfile() {
  wx.removeStorageSync(STORAGE_KEY);
}
module.exports = {
  normalizeBirthInput,
  getBirthProfile,
  saveBirthProfile,
  clearBirthProfile,
  STORAGE_KEY,
};
