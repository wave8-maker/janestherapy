"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Admin interface language.
 *
 * The admin used to print both languages on every label ("设置 Settings"), which
 * doubled the reading on a screen Jane scans between clients. One language at a
 * time, chosen from the sidebar and remembered on the device.
 *
 * Documents that leave the studio — the printed invoice and the printed intake
 * record — are not covered here. Those go to a studio and to insurers and
 * attorneys, so they stay English whatever this is set to.
 */
export type Lang = "zh" | "en";

/** Each entry is [中文, English]. */
const STRINGS = {
  // ── shell ──────────────────────────────────────────────────────────────────
  "nav.settings": ["设置", "Settings"],
  "nav.services": ["服务项目", "Services"],
  "nav.addons": ["附加服务", "Add-ons"],
  "nav.blog": ["博客编辑", "Blog Editor"],
  "nav.intake": ["客户登记", "Intake"],
  "nav.invoice": ["发票", "Invoice"],
  "shell.admin": ["管理后台", "Admin"],
  "shell.language": ["语言", "Language"],
  "shell.fontSize": ["字号", "Text size"],
  "shell.font.small": ["小", "S"],
  "shell.font.medium": ["中", "M"],
  "shell.font.large": ["大", "L"],
  "shell.logout": ["退出登录", "Log out"],

  // ── shared ─────────────────────────────────────────────────────────────────
  "common.save": ["保存并发布", "Save & Publish"],
  "common.saving": ["保存中…", "Saving…"],
  "common.savedNotice": [
    "✓ 已保存！网站将在约 2 分钟后更新。",
    "✓ Saved. The site updates in about two minutes.",
  ],
  "common.untitled": ["未命名", "Untitled"],
  "common.description": ["描述", "Description"],
  "common.pricing": ["价格", "Pricing"],
  "common.addPrice": ["+ 添加价格", "+ Add Price"],
  "common.edit": ["编辑", "Edit"],
  "common.delete": ["删除", "Delete"],
  "common.loading": ["加载中…", "Loading…"],
  "common.refresh": ["刷新", "Refresh"],
  "common.view": ["查看", "View"],
  "common.other": ["其他", "Other"],

  "error.sessionExpired": [
    "登录已过期，请重新登录。",
    "Your session expired — please sign in again.",
  ],
  "error.loadFailed": ["读取失败，请刷新重试。", "Couldn't load. Refresh and try again."],
  "error.saveFailed": ["保存失败，内容没有写入。", "Save failed — nothing was written."],

  // ── settings ───────────────────────────────────────────────────────────────
  "settings.announcement": ["公告横幅", "Announcement Banner"],
  "settings.announcementPlaceholder": [
    "留空则隐藏公告",
    "Leave blank to hide the banner",
  ],
  "settings.hours": ["营业时间", "Business Hours"],
  "settings.hoursPlaceholder": [
    "如：9:30 AM – 8:00 PM 或 Closed",
    "e.g. 9:30 AM – 8:00 PM, or Closed",
  ],

  // ── services ───────────────────────────────────────────────────────────────
  "services.confirmRemove": ["确认删除此服务？", "Remove this service?"],
  "services.name": ["服务名称", "Service Name"],
  "services.badge": ["标签（可选）", "Badge (optional)"],
  "services.badgePlaceholder": ["如：Signature 👍", "e.g. Signature 👍"],
  "services.durationPlaceholder": ["时长，如 60 minutes", "Duration, e.g. 60 minutes"],
  "services.pricePlaceholder": ["价格，如 $120", "Price, e.g. $120"],
  "services.extraDetails": ["附加说明（可选）", "Extra Details (optional)"],
  "services.addDetail": ["+ 添加说明", "+ Add Detail"],
  "services.remove": ["删除服务", "Remove Service"],
  "services.add": ["+ 添加服务", "+ Add Service"],

  // ── add-ons ────────────────────────────────────────────────────────────────
  "addons.confirmRemove": ["确认删除此附加服务？", "Remove this add-on?"],
  "addons.name": ["附加服务名称", "Add-on Name"],
  "addons.durationPlaceholder": ["时长（无则留空）", "Duration (blank if none)"],
  "addons.pricePlaceholder": ["价格，如 $30", "Price, e.g. $30"],
  "addons.remove": ["删除附加服务", "Remove Add-on"],
  "addons.add": ["+ 添加附加服务", "+ Add Add-on"],

  // ── blog ───────────────────────────────────────────────────────────────────
  "blog.confirmDelete": ["确认删除", "Delete"],
  "blog.back": ["← 返回文章列表", "← Back to posts"],
  "blog.title": ["标题", "Title"],
  "blog.date": ["日期", "Date"],
  "blog.excerpt": ["摘要（显示在博客列表）", "Excerpt (shown in the blog list)"],
  "blog.content": ["内容", "Content"],
  "blog.new": ["+ 新建文章", "+ New Post"],
  "blog.empty": ["暂无文章。", "No posts yet."],

  // ── intake ─────────────────────────────────────────────────────────────────
  "intake.heading": ["客户登记表", "Client Intake Forms"],
  "intake.empty": ["暂无登记表。", "No intake forms yet."],
  "intake.back": ["← 返回列表", "← Back to list"],
  "intake.print": ["打印 / 存 PDF", "Print / Save PDF"],
  "intake.confirmDelete": [
    "删除这份登记表？此操作无法撤销。",
    "Delete this intake form? This cannot be undone.",
  ],
  "intake.popupBlocked": [
    "请允许弹出窗口以打印。",
    "Please allow pop-ups to print this record.",
  ],
  "intake.submitted": ["提交于", "Submitted"],
  "intake.conditionsReported": ["客户申报的健康状况", "Conditions reported"],
  "intake.flags": ["健康提示", "flagged"],
  "intake.unsigned": ["未签名", "Unsigned"],
  "intake.recordStored": [
    "签署记录与电子签名已存储",
    "Consent record and signature on file",
  ],
  "intake.consentsAgreed": ["条同意", "clauses agreed"],
  "intake.termsVersion": ["条款版本", "terms version"],
  "intake.printToView": ["打印查看完整内容", "print to read the full text"],
  "intake.recordIncomplete": ["签署记录不完整", "Incomplete signing record"],
  "intake.noConsentRecord": [
    "这份表格早于电子签名功能，没有同意条款和签名。",
    "This form predates e-signatures — no consent record or signature.",
  ],
  "intake.agreedCount": ["已同意", "Agreed"],
  "intake.of": ["条中的", "of"],
  "intake.noSignature": ["无电子签名", "no signature"],

  // ── intake detail rows ─────────────────────────────────────────────────────
  "field.date": ["日期", "Date"],
  "field.address": ["地址", "Address"],
  "field.email": ["邮箱", "Email"],
  "field.phone": ["电话", "Phone"],
  "field.birthday": ["生日", "Date of Birth"],
  "field.occupation": ["职业", "Occupation"],
  "field.referredBy": ["介绍人", "Referred By"],
  "field.heardAbout": ["从哪知道我们", "Heard About Us"],
  "field.emergencyContact": ["紧急联系人", "Emergency Contact"],
  "field.conditions": ["申报的健康状况", "Conditions Reported"],
  "field.healthAttested": ["已确认如实申报", "Health Attested"],
  "field.injuries": ["受伤", "Injuries"],
  "field.injuryDetails": ["受伤详情", "Injury Details"],
  "field.surgeries": ["手术", "Surgeries"],
  "field.surgeryDetails": ["手术详情", "Surgery Details"],
  "field.medicalConditions": ["其他健康说明", "Other Health Notes"],
  "field.pregnant": ["怀孕", "Pregnant"],
  "field.pregnancyDetails": ["怀孕详情", "Pregnancy Details"],
  "field.areasToAvoid": ["需避开的部位", "Areas to Avoid"],
  "field.goals": ["今日目标", "Goals"],
  "field.pressure": ["力度偏好", "Preferred Pressure"],
  "field.painLevel": ["疼痛等级", "Pain Level"],
  "field.enhancements": ["附加服务", "Enhancements"],
  "field.sessionPreference": ["沟通偏好", "Communication"],
  "field.painMarkers": ["身体标注", "Marked Discomfort"],
  "field.front": ["正面", "Front"],
  "field.back": ["背面", "Back"],
  "field.medications": ["用药", "Medications"],
  "field.allergies": ["过敏", "Allergies"],
  "field.physician": ["家庭医生", "Primary Physician"],
  "field.service": ["服务项目", "Service"],
  "field.duration": ["时长", "Duration"],
  "field.bodyworkPreference": ["按摩重点", "Bodywork Preference"],
  "field.music": ["音乐", "Music"],
  "field.roomTemperature": ["室温", "Room Temperature"],
  "field.yes": ["是", "Yes"],
  "field.no": ["否", "No"],

  // ── invoice ────────────────────────────────────────────────────────────────
  "invoice.title": ["承包发票生成器", "Contractor Invoice Generator"],
  "invoice.intro": [
    "直接在下面这张「发票纸」上填写，位置就是打印出来的位置。每行应付 = 销售额 + 小费。",
    "Fill in the sheet below — every field sits where it will print. Amount due per line = sales + gratuity.",
  ],
  "invoice.loadDefaults": ["套用常用信息", "Load Defaults"],
  "invoice.saveDefaults": ["保存常用信息", "Save Defaults"],
  "invoice.saved": ["已保存", "Saved"],
  "invoice.reset": ["清空重填", "Reset"],
  "invoice.defaultsError": ["无法保存常用信息。", "Could not save defaults."],
  "invoice.popupBlocked": [
    "请允许弹出窗口以生成发票。",
    "Please allow pop-ups to generate the invoice.",
  ],
  "invoice.fromName": ["开票方名称", "Your business name"],
  "invoice.fromTitle": ["开票方头衔", "Title line"],
  "invoice.fromAddress": ["开票方地址", "Your address"],
  "invoice.fromEmail": ["开票方邮箱", "Your email"],
  "invoice.fromPhone": ["开票方电话", "Your phone"],
  "invoice.cityPlaceholder": ["城市，如 San Jose, CA", "City, e.g. San Jose, CA"],
  "invoice.billTo": ["收票方", "Bill to"],
  "invoice.studioName": ["工作室名称", "Studio name"],
  "invoice.attnPlaceholder": ["联系人 / 头衔", "Attn / title"],
  "invoice.name": ["名称", "Name"],
  "invoice.line2": ["第二行", "Line 2"],
  "invoice.invoiceNo": ["发票号", "Invoice #"],
  "invoice.auto": ["自动", "Auto"],
  "invoice.invoiceDate": ["开票日期", "Invoice date"],
  "invoice.today": ["今天", "Today"],
  "invoice.colDate": ["日期", "Date"],
  "invoice.colDescription": ["服务说明", "Description"],
  "invoice.colSales": ["销售", "Sales"],
  "invoice.colGratuity": ["小费", "Gratuity"],
  "invoice.colDue": ["应付", "Amount Due"],
  "invoice.totals": ["合计", "Totals"],
  "invoice.addLine": ["+ 添加一行", "+ Add line"],
  "invoice.removeLine": ["删除此行", "Remove line"],
  "invoice.row": ["行", "Row"],
  "invoice.amountDue": ["应付金额", "Amount due"],
  "invoice.notes": ["备注（可选）", "Notes (optional)"],
  "invoice.notesPlaceholder": [
    "备注（可选）— 如付款方式、Venmo 等",
    "Notes (optional) — payment method, Venmo, etc.",
  ],
  "invoice.reviewThen": ["检查无误后生成 PDF", "Review, then generate"],
  "invoice.generate": ["生成 / 打印 PDF", "Generate PDF"],

  // ── rich text editor ───────────────────────────────────────────────────────
  "editor.placeholder": ["开始写作…", "Start writing…"],
  "editor.imageFailed": ["图片插入失败", "Image insert failed"],
  "editor.enterUrl": ["请输入链接地址：", "Enter URL:"],
  "editor.bold": ["粗体", "Bold"],
  "editor.italic": ["斜体", "Italic"],
  "editor.strike": ["删除线", "Strikethrough"],
  "editor.h1": ["大标题", "Heading 1"],
  "editor.h2": ["中标题", "Heading 2"],
  "editor.h3": ["小标题", "Heading 3"],
  "editor.bulletList": ["无序列表", "Bullet list"],
  "editor.orderedList": ["有序列表", "Ordered list"],
  "editor.listLabel": ["列表", "List"],
  "editor.blockquote": ["引用", "Blockquote"],
  "editor.link": ["链接", "Link"],
  "editor.image": ["图片", "Image"],
  "editor.insertImage": ["插入图片", "Insert image"],
  "editor.undo": ["撤销", "Undo"],
  "editor.redo": ["重做", "Redo"],
  "editor.formatting": ["格式工具", "Formatting"],
  "editor.formattingMenu": ["格式菜单", "Formatting menu"],
} as const;

export type StringKey = keyof typeof STRINGS;

const STORAGE_KEY = "jt-admin-lang";

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey) => string;
}

const LangContext = createContext<LangValue>({
  lang: "zh",
  setLang: () => {},
  t: (key) => STRINGS[key][0],
});

export function AdminLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  // Read after mount: the server has no way to know the choice, and rendering
  // the stored language straight away would mismatch the markup it sent.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "zh" || stored === "en") setLangState(stored);
    } catch {
      /* private mode — the default is fine */
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the choice just won't survive a reload */
    }
  }, []);

  const t = useCallback((key: StringKey) => STRINGS[key][lang === "zh" ? 0 : 1], [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useAdminLang(): LangValue {
  return useContext(LangContext);
}
