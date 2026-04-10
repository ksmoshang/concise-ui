import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlusCircle, Zap, FolderSearch, X, 
  Settings2, Minus, Layers, Save, Trash2, Check, ArrowDownToLine, Power, Code2, Settings, AlertTriangle, RotateCcw, Image as ImageIcon
} from "lucide-react";

// ==========================================
// 稳健下拉框组件 
// ==========================================
const CustomSelect = ({ value, options, onChange, className = "" }: {value:string, options:{label:string, value:string}[], onChange:(v:string)=>void, className?:string}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value) || options[0] || { label: value || "...", value };

  return (
    <div className={`relative ${className}`} tabIndex={0} onBlur={() => setIsOpen(false)}>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-zinc-200 cursor-pointer flex justify-between items-center transition-colors hover:border-white/30">
        <span className="truncate leading-relaxed" style={{ textShadow: 'none' }}>{selected.label}</span>
        <span className="text-[10px] text-zinc-500 opacity-70 ml-2 shrink-0">▼</span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute left-0 right-0 top-[105%] z-[99999] bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl custom-scrollbar py-1">
            {options.map((opt) => (
              <div key={opt.value} onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }} className={`px-4 py-2.5 text-xs cursor-pointer transition-colors ${value === opt.value ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-300 hover:bg-white/10'}`} style={{ textShadow: 'none', fontFamily: opt.value.includes(',') ? undefined : opt.value }}>
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 修复 TS2339：确保 zh 和 en 具有完全相同的键值
const dict = {
  zh: {
    title: "右键菜单简化", sub: "WINDOWS 极简控制中心", classicTitle: "恢复 Win10 经典右键菜单", classicSub: "跳过繁琐的“显示更多选项”，一键展开", 
    thirdParty: "第三方菜单项接管", noExt: "未发现第三方扩展", restartBtn: "重启资源管理器", restartSub: "功能应用无效时点击", 
    adminAlert: "⚠️ 权限不足", adminSub: "修改此项需要全局权限。请关闭软件后，右键「以管理员身份运行」。", 
    settingsTitle: "综合控制中心", langLabel: "系统语言", bgOpacity: "图层遮罩透明度", bgColor: "环境色调 (RGB)", 
    effectLabel: "底层材质模式", effAcrylic: "亚克力 (真实透视)", effMica: "云母 (仅透桌面)", effBlur: "高斯模糊 (失焦不变暗)", 
    addTitle: "注入新选项", addSub: "将自定义软件添加到右键", advMode: "极客模式", simpleMode: "极简模式", deploy: "执行注入", forceDeploy: "强制写入底层", 
    closeTitle: "退出行为配置", closeSub: "您可以设定点击关闭按钮(X)时的默认动作。", minTray: "最小化到后台", exitApp: "彻底退出程序", 
    closeAction: "退出行为", closeAsk: "每次询问", closeTray: "直接隐入托盘", closeQuit: "直接彻底退出", rememberChoice: "记住我的选择，不再弹窗", 
    themeSnapshots: "全局主题快照", saveTheme: "保存当前主题", fontFamily: "全局字体风格", fontSize: "文字缩放比例", shadowType: "文字光影效果", 
    shadowTypeNone: "无效果", shadowTypeShadow: "深邃阴影", shadowTypeGlow: "霓虹发光", shadowIntensity: "光影强度", fontShadowColor: "光影色彩", resetDefaults: "恢复默认设置",
    bgImageTitle: "自定义背景图像", uploadImg: "上传本地图片", clearImg: "移除图片", bgModeTitle: "图片填充模式", bgCover: "裁切填充 (Cover)", bgContain: "等比缩放 (Contain)", bgStretch: "拉伸铺满 (Stretch)", imgTooLarge: "图片处理失败，请重试！",
    menuBg: "添加到：桌面/空白处", menuFile: "添加到：所有文件", menuFolder: "添加到：所有文件夹", bgImageBlur: "背景图模糊度",
    profileTitle: "配置快照", profileSub: "管理屏蔽的右键选项列表", save: "保存", know: "我知道了", exitNow: "立即退出"
  },
  en: {
    title: "Context Surgeon", sub: "WINDOWS MINIMAL CONTROL CENTER", classicTitle: "Restore Win10 Classic Context Menu", classicSub: "Skip 'Show more options', expand instantly", 
    thirdParty: "Third-Party Extensions", noExt: "No third-party extensions found", restartBtn: "Restart Explorer", restartSub: "Click if changes do not apply", 
    adminAlert: "⚠️ Access Denied", adminSub: "Global changes require admin rights. Close and 'Run as Administrator'.", 
    settingsTitle: "Control Center", langLabel: "Language", bgOpacity: "Overlay Opacity", bgColor: "Environment Tint (RGB)", 
    effectLabel: "Base Material", effAcrylic: "Acrylic (Real see-through)", effMica: "Mica (Wallpaper only)", effBlur: "Blur (Stays blurred on lost focus)", 
    addTitle: "Inject Action", addSub: "Add custom software to right-click", advMode: "Geek Mode", simpleMode: "Simple Mode", deploy: "Inject", forceDeploy: "Force Write", 
    closeTitle: "Close Action Config", closeSub: "Set default behavior when clicking the close (X) button.", minTray: "Minimize to Tray", exitApp: "Exit Completely", 
    closeAction: "Exit Behavior", closeAsk: "Always Ask", closeTray: "Hide to Tray", closeQuit: "Exit Completely", rememberChoice: "Remember and don't ask again", 
    themeSnapshots: "Global Theme Snapshots", saveTheme: "Save Current Theme", fontFamily: "Global Font Style", fontSize: "Text Scale", shadowType: "Text Effects", 
    shadowTypeNone: "None", shadowTypeShadow: "Deep Shadow", shadowTypeGlow: "Neon Glow", shadowIntensity: "Effect Intensity", fontShadowColor: "Effect Color", resetDefaults: "Reset to Defaults",
    bgImageTitle: "Custom Background Image", uploadImg: "Upload Image", clearImg: "Remove Image", bgModeTitle: "Fill Mode", bgCover: "Crop to Fill (Cover)", bgContain: "Fit to Bounds (Contain)", bgStretch: "Stretch (100%)", imgTooLarge: "Failed to process image!",
    menuBg: "Add to: Desktop/Background", menuFile: "Add to: All Files", menuFolder: "Add to: All Folders", bgImageBlur: "Background Blur",
    profileTitle: "Snapshots", profileSub: "Manage disabled items list", save: "Save", know: "Got it", exitNow: "Exit Now"
  }
};

interface ContextItem { id: string; name: string; reg_path: string; is_enabled: boolean; category: string; }
interface FontSettings { family: string; scale: number; type: 'none'|'shadow'|'glow'; intensity: number; color: string; }
interface ThemeProfile { opacity: number; bgColor: string; blurEffect: string; fontSettings: FontSettings; bgImage: string; bgSizeMode: string; bgImageBlur: number; }

const DEFAULT_FONT: FontSettings = { family: "system-ui, sans-serif", scale: 1, type: "none", intensity: 10, color: "#ffffff" };
const DEFAULT_THEME = { opacity: 0.5, bgColor: "0, 0, 0", blurEffect: "acrylic", bgImage: "", bgSizeMode: "cover", bgImageBlur: 0 };

const hexToRgb = (h: string) => { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : '0, 0, 0'; };
const rgbToHex = (r: string) => { const parts = r.split(','); const R = parseInt(parts[0]?.trim()||'0'); const G = parseInt(parts[1]?.trim()||'0'); const B = parseInt(parts[2]?.trim()||'0'); return "#" + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1); };

const safeSetItem = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch (e) { console.error(`Storage limit exceeded for ${key}`); } };
const safeParse = (key: string, defaultVal: any) => { try { const val = localStorage.getItem(key); if (!val || val === "undefined") return defaultVal; return { ...defaultVal, ...JSON.parse(val) }; } catch (e) { return defaultVal; } };

export default function App() {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [isClassicMenu, setIsClassicMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showAdminError, setShowAdminError] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);

  const [lang, setLang] = useState<'zh'|'en'>(() => (localStorage.getItem('lang') === 'en' ? 'en' : 'zh'));
  const [opacity, setOpacity] = useState(() => { const v = localStorage.getItem('bgOpacity'); return v && v !== "undefined" ? parseFloat(v) : DEFAULT_THEME.opacity; });
  const [bgColor, setBgColor] = useState(() => { const v = localStorage.getItem('bgColor'); return v && v !== "undefined" ? v : DEFAULT_THEME.bgColor; });
  const [blurEffect, setBlurEffect] = useState(() => { const v = localStorage.getItem('blurEffect'); return v && v !== "undefined" ? v : DEFAULT_THEME.blurEffect; });
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('bgImage') || DEFAULT_THEME.bgImage);
  const [bgSizeMode, setBgSizeMode] = useState(() => localStorage.getItem('bgSizeMode') || DEFAULT_THEME.bgSizeMode);
  const [bgImageBlur, setBgImageBlur] = useState(() => { const v = localStorage.getItem('bgImageBlur'); return v && v !== "undefined" ? parseFloat(v) : DEFAULT_THEME.bgImageBlur; });
  const [fontSettings, setFontSettings] = useState<FontSettings>(() => safeParse('fontSettings', DEFAULT_FONT));
  const [closeBehavior, setCloseBehavior] = useState<'ask'|'tray'|'quit'>(() => {
    const v = localStorage.getItem('closeBehavior');
    return (v === 'tray' || v === 'quit' || v === 'ask') ? (v as any) : 'ask';
  });
  const [rememberClose, setRememberClose] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sysFonts, setSysFonts] = useState<string[]>([]);
  const [themeProfiles, setThemeProfiles] = useState<Record<string, ThemeProfile>>(() => safeParse('concise_ui_themes', {}));
  const [newThemeName, setNewThemeName] = useState("");
  const [profiles, setProfiles] = useState<Record<string, string[]>>(() => safeParse('concise_ui_profiles', {}));
  const [newProfileName, setNewProfileName] = useState("");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [simpleAction, setSimpleAction] = useState({ name: "", path: "", category: "Directory\\Background\\shell" });
  const [advAction, setAdvAction] = useState({ basePath: "*\\shell", keyName: "", displayName: "", command: "", iconPath: "" });

  const t = dict[lang] || dict['zh'];

  const fetchState = async () => {
    try {
      const menuData: ContextItem[] = await invoke("scan_menu");
      setItems(menuData);
      const classicState: boolean = await invoke("check_win11_classic");
      setIsClassicMenu(classicState);
    } catch(e) { console.error(e); }
  };

  useEffect(() => { 
    invoke("is_admin").then(admin => setIsAdmin(admin as boolean)).catch(() => {});
    invoke("get_system_fonts").then(fonts => setSysFonts(fonts as string[])).catch(() => {});
    fetchState(); 
    setTimeout(() => { invoke("show_window").catch(() => {}); }, 200);
    const setupListener = async () => { 
        const unlisten = await listen('open-settings', () => { setShowSettings(true); }); 
        return unlisten; 
    };
    const unlistenPromise = setupListener();
    return () => { unlistenPromise.then(fn => fn()); };
  }, []);

  useEffect(() => { document.documentElement.style.fontSize = `${fontSettings.scale * 16}px`; }, [fontSettings.scale]);
  useEffect(() => { safeSetItem('lang', lang); invoke('update_tray_menu', { lang }).catch(() => {}); }, [lang]);
  useEffect(() => { safeSetItem('closeBehavior', closeBehavior); }, [closeBehavior]);
  useEffect(() => { safeSetItem('bgOpacity', opacity.toString()); }, [opacity]);
  useEffect(() => { safeSetItem('bgColor', bgColor); }, [bgColor]);
  useEffect(() => { safeSetItem('fontSettings', JSON.stringify(fontSettings)); }, [fontSettings]);
  useEffect(() => { safeSetItem('bgImage', bgImage); }, [bgImage]);
  useEffect(() => { safeSetItem('bgSizeMode', bgSizeMode); }, [bgSizeMode]);
  useEffect(() => { safeSetItem('bgImageBlur', bgImageBlur.toString()); }, [bgImageBlur]);
  useEffect(() => { 
    const timer = setTimeout(() => {
      localStorage.setItem('blurEffect', blurEffect);
      invoke("update_window_effect", { effect: blurEffect }).catch(()=>{});
    }, 50);
    return () => clearTimeout(timer);
  }, [blurEffect]);

  const handleMinimize = async () => { await invoke("minimize_window"); };
  const handleExitApp = async () => { setIsExiting(true); setTimeout(async () => { await invoke("exit_app"); }, 300); };
  const handleHideToTray = async () => { setShowCloseModal(false); await invoke("hide_window"); };

  const handleCloseClick = () => { if (closeBehavior === 'tray') { invoke("hide_window"); } else if (closeBehavior === 'quit') { handleExitApp(); } else { setShowCloseModal(true); } };

  const executeCloseAction = async (action: 'hide'|'close') => {
    if (rememberClose) { const behavior = action === 'hide' ? 'tray' : 'quit'; setCloseBehavior(behavior); safeSetItem('closeBehavior', behavior); }
    if (action === 'hide') { handleHideToTray(); } else { handleExitApp(); }
  };

  const handleToggle = async (item: ContextItem) => {
    const updatedState = !item.is_enabled;
    setItems(items.map(i => i.id === item.id ? { ...i, is_enabled: updatedState } : i));
    try { await invoke("toggle_item", { path: item.reg_path, enable: updatedState }); } catch (e) { setShowAdminError(true); fetchState(); }
  };

  const handleToggleClassic = async () => {
    const newState = !isClassicMenu;
    setIsClassicMenu(newState);
    try { await invoke("toggle_win11_classic", { enable: newState }); } catch(e) { setShowAdminError(true); fetchState(); }
  };

  const handleAdd = async () => {
    try {
      if (isAdvancedMode) { await invoke("add_custom_action", { basePath: advAction.basePath, keyName: advAction.keyName, displayName: advAction.displayName, command: advAction.command, iconPath: advAction.iconPath }); } 
      else { if (!simpleAction.name || !simpleAction.path) return; await invoke("add_custom_action", { basePath: simpleAction.category, keyName: simpleAction.name.replace(/\s+/g, ""), displayName: simpleAction.name, command: `"${simpleAction.path}" "%1"`, iconPath: simpleAction.path }); }
      setIsAdding(false); fetchState();
    } catch (e) { setShowAdminError(true); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920; const MAX_HEIGHT = 1080;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        try { setBgImage(canvas.toDataURL('image/jpeg', 0.8)); } catch (err) { alert(t.imgTooLarge); }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getModalBg = () => { const o = opacity > 0.8 ? opacity : opacity + 0.2; return `rgba(${bgColor}, ${o})`; };
  const getTextStyle = () => {
    let ts = 'none';
    if (fontSettings.type === 'shadow') ts = `2px 2px ${fontSettings.intensity}px ${fontSettings.color}`;
    if (fontSettings.type === 'glow') ts = `0px 0px ${fontSettings.intensity}px ${fontSettings.color}, 0px 0px ${fontSettings.intensity*1.5}px ${fontSettings.color}`;
    return { fontFamily: fontSettings.family, textShadow: ts };
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 0.98 : 1 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="h-screen w-screen relative overflow-hidden rounded-xl border border-white/10 shadow-2xl text-zinc-100 bg-transparent" style={getTextStyle()}>
      {bgImage && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute" style={{ top: bgImageBlur > 0 ? '-20px' : '0', left: bgImageBlur > 0 ? '-20px' : '0', right: bgImageBlur > 0 ? '-20px' : '0', bottom: bgImageBlur > 0 ? '-20px' : '0', backgroundImage: `url(${bgImage})`, backgroundSize: bgSizeMode === 'stretch' ? '100% 100%' : bgSizeMode, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: `blur(${bgImageBlur}px)`, transform: bgImageBlur > 0 ? 'scale(1.05)' : 'none' }} />
        </div>
      )}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: `rgba(${bgColor}, ${opacity})` }} />

      <div className="relative z-10 flex flex-col h-full">
        <div style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} className="w-full h-8 flex items-center justify-center z-[9999] shrink-0 group"><div className="w-16 h-1 bg-white/20 rounded-full transition-all duration-300 group-hover:w-24 group-hover:bg-white/50 pointer-events-none" /></div>
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} className="absolute top-0 right-0 h-8 flex items-center px-4 gap-2 z-[10000]">
          <button onClick={handleMinimize} className="p-1 text-zinc-400 hover:text-white hover:bg-white/20 rounded-md transition-colors"><Minus size={14} /></button>
          <button onClick={handleCloseClick} className="p-1 text-zinc-400 hover:text-white hover:bg-red-500/80 rounded-md transition-colors"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col px-8 pb-8 pt-4">
          <header className="flex justify-between items-end mb-8 select-none shrink-0">
            <div className="cursor-default py-2"><h1 className="text-3xl font-light tracking-widest italic opacity-90 leading-relaxed drop-shadow-md">{t.title}</h1><p className="text-[10px] text-zinc-400 tracking-[0.2em] mt-1 uppercase">{t.sub}</p></div>
            <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} className="flex gap-3 z-50">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowSettings(true)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center border border-white/10"><Settings size={18} /></motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowProfiles(true)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center border border-white/10"><Layers size={18} /></motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsAdding(true)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center border border-white/10"><PlusCircle size={18} /></motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => invoke("restart_explorer")} className="flex items-center gap-3 px-5 py-2 bg-zinc-200/90 text-black rounded-full transition-colors group">
                <Zap size={16} className="text-black group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start text-left py-1" style={{ textShadow: 'none' }}><span className="text-xs font-bold leading-tight">{t.restartBtn}</span><span className="text-[9px] text-zinc-600 italic leading-tight mt-0.5">{t.restartSub}</span></div>
              </motion.button>
            </div>
          </header>

          <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg"><Settings2 size={20} /></div>
              <div className="select-none py-1"><h3 className="text-sm font-medium text-white leading-relaxed">{t.classicTitle}</h3><p className="text-[11px] text-zinc-300 mt-0.5">{t.classicSub}</p></div>
            </div>
            <button style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} onClick={handleToggleClassic} className={`relative w-11 h-6 rounded-full transition-colors shadow-inner ${isClassicMenu ? 'bg-blue-500' : 'bg-black/40'}`}>
              <motion.div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md" animate={{ x: isClassicMenu ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            </button>
          </div>

          <div className="text-[10px] font-medium text-zinc-400 tracking-widest mb-4 uppercase select-none p-1 shrink-0">{t.thirdParty}</div>
          <main className="flex-1 overflow-y-auto pr-2 space-y-2 pb-10 custom-scrollbar" style={{ maskImage: "linear-gradient(to bottom, transparent, black 30px, black calc(100% - 40px), transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 30px, black calc(100% - 40px), transparent)" }}>
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40 select-none pt-10"><FolderSearch size={40} strokeWidth={1} /><p className="mt-4 text-xs tracking-widest uppercase p-1">{t.noExt}</p></div>
            ) : (
              items.map((item) => (
                <div key={item.id} className={`group flex items-center justify-between p-4 rounded-2xl transition-all border shadow-sm ${item.is_enabled ? 'bg-white/10 border-white/10' : 'bg-black/20 border-white/5 opacity-60'}`}>
                  <div className="flex flex-col select-none py-1">
                    <div className="flex items-center gap-3"><span className="text-sm font-medium tracking-wide text-white leading-relaxed">{item.name}</span><span className="text-[9px] px-2 py-0.5 rounded-full border border-white/20 text-zinc-300 bg-white/5" style={{ textShadow: 'none' }}>{item.category}</span></div>
                    <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[280px] mt-1.5" style={{ textShadow: 'none' }}>{item.reg_path}</span>
                  </div>
                  <button style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} onClick={() => handleToggle(item)} className={`relative w-11 h-6 rounded-full transition-colors shadow-inner ${item.is_enabled ? 'bg-zinc-200' : 'bg-black/50'}`}>
                    <motion.div className="absolute top-1 left-1 w-4 h-4 rounded-full shadow-md" animate={{ x: item.is_enabled ? 20 : 0, backgroundColor: item.is_enabled ? '#18181b' : '#ffffff' }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </button>
                </div>
              ))
            )}
          </main>
        </div>

        {/* 弹窗部分 */}
        <AnimatePresence>
          {showAdminError && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-md">
              <motion.div drag dragMomentum={false} dragConstraints={{ top: -300, bottom: 300, left: -300, right: 300 }} initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} style={{ backgroundColor: getModalBg() }} className="absolute border border-red-500/30 rounded-[32px] w-full max-w-sm flex flex-col overflow-hidden shadow-2xl">
                <div className="p-8 pt-2 text-center" onPointerDownCapture={(e)=>e.stopPropagation()}><AlertTriangle size={24} className="mx-auto text-red-400 mb-4" /><h2 className="text-xl font-bold text-red-400 mb-2 leading-relaxed py-1">{t.adminAlert}</h2><p className="text-xs text-zinc-300 mb-8 py-1">{t.adminSub}</p><button onClick={() => setShowAdminError(false)} className="w-full py-3 bg-white/10 rounded-xl text-sm">{t.know}</button></div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCloseModal && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-md">
              <motion.div drag dragMomentum={false} dragConstraints={{ top: -300, bottom: 300, left: -300, right: 300 }} initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: getModalBg() }} className="absolute border border-white/10 rounded-[32px] w-full max-w-sm flex flex-col overflow-hidden shadow-2xl">
                <div className="p-8 pt-2 text-center" onPointerDownCapture={(e)=>e.stopPropagation()}>
                  <h2 className="text-xl font-medium tracking-tight mb-2 leading-relaxed py-1">{t.closeTitle}</h2><p className="text-xs text-zinc-300 mb-6 py-1">{t.closeSub}</p>
                  <label className="flex items-center justify-center gap-2 text-xs text-zinc-300 mb-6 cursor-pointer py-1"><input type="checkbox" checked={rememberClose} onChange={(e) => setRememberClose(e.target.checked)} className="w-3.5 h-3.5 accent-white" />{t.rememberChoice}</label>
                  <button onClick={() => executeCloseAction('hide')} className="w-full py-3.5 bg-zinc-100 text-black rounded-2xl font-bold text-sm mb-2"><ArrowDownToLine size={16} className="inline mr-2" /> {t.minTray}</button>
                  <button onClick={() => executeCloseAction('close')} className="w-full py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-colors"><Power size={14} className="inline mr-2" /> {t.exitApp}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xl">
              <motion.div drag dragMomentum={false} dragConstraints={{ top: -200, bottom: 200, left: -300, right: 300 }} initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: getModalBg() }} className="absolute border border-white/10 rounded-[32px] w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="flex justify-between items-center p-6 pb-4 shrink-0 cursor-grab active:cursor-grabbing">
                  <h2 className="text-lg font-medium leading-relaxed">{t.settingsTitle}</h2>
                  <div className="flex items-center gap-3" onPointerDownCapture={(e)=>e.stopPropagation()}><button onClick={() => { setOpacity(DEFAULT_THEME.opacity); setBgColor(DEFAULT_THEME.bgColor); setBlurEffect(DEFAULT_THEME.blurEffect); setFontSettings(DEFAULT_FONT); setBgImage(""); setBgSizeMode("cover"); setBgImageBlur(0); setCloseBehavior('ask'); }} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs transition-colors"><RotateCcw size={12}/> {t.resetDefaults}</button><X size={18} className="cursor-pointer opacity-50 hover:opacity-100" onClick={() => setShowSettings(false)} /></div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6 custom-scrollbar cursor-auto" onPointerDownCapture={(e)=>e.stopPropagation()}>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div><label className="text-xs text-zinc-400 mb-2 block">{t.langLabel}</label><div className="flex bg-black/40 rounded-xl p-1"><button onClick={()=>setLang('zh')} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${lang==='zh'?'bg-white/20 text-white':'text-zinc-400'}`}>中文</button><button onClick={()=>setLang('en')} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${lang==='en'?'bg-white/20 text-white':'text-zinc-400'}`}>Eng</button></div></div>
                            <div><label className="text-xs text-zinc-400 mb-2 block">{t.closeAction}</label><CustomSelect value={closeBehavior} onChange={(v:any) => setCloseBehavior(v)} options={[{label:t.closeAsk, value:'ask'}, {label:t.closeTray, value:'tray'}, {label:t.closeQuit, value:'quit'}]} /></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-xs text-zinc-400 mb-2 block">{t.effectLabel}</label><CustomSelect value={blurEffect} onChange={setBlurEffect} options={[{label:t.effAcrylic, value:'acrylic'}, {label:t.effMica, value:'mica'}, {label:t.effBlur, value:'blur'}]} /></div>
                            <div className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/5"><div><label className="text-xs text-zinc-400 block">{t.bgColor}</label><span className="text-[9px] font-mono text-zinc-500">RGB: {bgColor}</span></div><input type="color" value={rgbToHex(bgColor)} onChange={(e) => setBgColor(hexToRgb(e.target.value))} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" /></div>
                        </div>
                    </div>
                    <div><label className="text-xs text-zinc-400 mb-2 block">{t.bgOpacity} ({Math.round(opacity*100)}%)</label><input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="w-full accent-white" /></div>
                    <div className="border-t border-white/10 pt-6 space-y-4">
                        <div className="flex justify-between items-center"><label className="text-xs text-zinc-400 block">{t.bgImageTitle}</label><div className="flex gap-2"><input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />{bgImage && <button onClick={() => setBgImage("")} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-[10px]">{t.clearImg}</button>}<button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1 bg-white/10 text-white rounded text-[10px]"><ImageIcon size={12}/> {t.uploadImg}</button></div></div>
                        {bgImage && <><div className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/5"><label className="text-xs text-zinc-400 block">{t.bgModeTitle}</label><div className="w-1/2"><CustomSelect value={bgSizeMode} onChange={setBgSizeMode} options={[{label:t.bgCover, value:'cover'}, {label:t.bgContain, value:'contain'}, {label:t.bgStretch, value:'stretch'}]} /></div></div><div><label className="text-xs text-zinc-400 mb-2 block">{t.bgImageBlur} ({bgImageBlur}px)</label><input type="range" min="0" max="50" step="1" value={bgImageBlur} onChange={e => setBgImageBlur(parseFloat(e.target.value))} className="w-full accent-white" /></div></>}
                    </div>
                    <div className="border-t border-white/10 pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs text-zinc-400 mb-2 block">{t.fontFamily}</label><CustomSelect value={fontSettings.family} onChange={v => setFontSettings({...fontSettings, family: v})} options={sysFonts.map(f => ({ label: f, value: f }))} /></div>
                            <div><label className="text-xs text-zinc-400 mb-2 block">{t.shadowType}</label><div className="flex bg-black/40 rounded-xl p-1">{(['none', 'shadow', 'glow'] as const).map(type => (<button key={type} onClick={()=>setFontSettings({...fontSettings, type})} className={`flex-1 py-1 text-[10px] rounded-lg transition-colors ${fontSettings.type===type?'bg-white/20 text-white':'text-zinc-400'}`}>{type === 'none' ? t.shadowTypeNone : type === 'shadow' ? t.shadowTypeShadow : t.shadowTypeGlow}</button>))}</div></div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="text-xs text-zinc-400 mb-2 block">{t.fontSize} ({Math.round(fontSettings.scale*100)}%)</label><input type="range" min="0.8" max="1.4" step="0.05" value={fontSettings.scale} onChange={e => setFontSettings({...fontSettings, scale: parseFloat(e.target.value)})} className="w-full accent-white" /></div>
                            {fontSettings.type !== 'none' && <div className="flex gap-4"><div className="flex-1"><label className="text-xs text-zinc-400 mb-2 block">{t.shadowIntensity}</label><input type="range" min="1" max="25" step="1" value={fontSettings.intensity} onChange={e => setFontSettings({...fontSettings, intensity: parseInt(e.target.value)})} className="w-full accent-white" /></div><div className="flex items-center"><input type="color" value={fontSettings.color} onChange={(e) => setFontSettings({...fontSettings, color: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" /></div></div>}
                        </div>
                    </div>
                    <div className="pt-6 border-t border-white/10"><label className="text-xs text-zinc-400 mb-3 block">{t.themeSnapshots}</label><div className="flex gap-2 mb-3"><input value={newThemeName} onChange={e => setNewThemeName(e.target.value)} placeholder="New Theme Name..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none" /><button onClick={() => { if(!newThemeName.trim())return; const updated = {...themeProfiles, [newThemeName]: { opacity, bgColor, blurEffect, fontSettings, bgImage, bgSizeMode, bgImageBlur }}; setThemeProfiles(updated); safeSetItem('concise_ui_themes', JSON.stringify(updated)); setNewThemeName(""); }} className="px-3 bg-white/10 rounded-xl text-xs"><Save size={14} className="inline mr-1"/> {t.saveTheme}</button></div>
                    <div className="space-y-1.5">{Object.entries(themeProfiles).map(([name, theme]) => (
                        <div key={name} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg group hover:bg-white/10"><span className="text-xs font-medium">{name}</span><div className="flex gap-2"><button onClick={() => { setOpacity(theme.opacity); setBgColor(theme.bgColor); setBlurEffect(theme.blurEffect); setFontSettings(theme.fontSettings || DEFAULT_FONT); setBgImage(theme.bgImage||""); setBgSizeMode(theme.bgSizeMode||"cover"); setBgImageBlur(theme.bgImageBlur||0); }} className="p-1.5 bg-blue-500/10 text-blue-400 rounded-md"><Check size={14}/></button><button onClick={() => { const u={...themeProfiles}; delete u[name]; setThemeProfiles(u); safeSetItem('concise_ui_themes', JSON.stringify(u)); }} className="p-1.5 bg-red-500/10 text-red-400 rounded-md opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button></div></div>
                    ))}</div></div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showProfiles && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xl">
              <motion.div drag dragMomentum={false} dragConstraints={{ top: -300, bottom: 300, left: -300, right: 300 }} initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: getModalBg() }} className="absolute border border-white/10 rounded-[32px] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-6 pb-4 shrink-0 cursor-grab active:cursor-grabbing"><div><h2 className="text-lg font-medium leading-relaxed">{t.profileTitle}</h2><p className="text-xs text-zinc-400">{t.profileSub}</p></div><X size={18} className="cursor-pointer" onPointerDownCapture={(e)=>e.stopPropagation()} onClick={() => setShowProfiles(false)} /></div>
                <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-2 custom-scrollbar" onPointerDownCapture={(e)=>e.stopPropagation()}>
                  <div className="flex gap-2 mb-6"><input placeholder="Profile Name" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none" /><button onClick={() => { if(newProfileName){ const updated = {...profiles, [newProfileName]: items.filter(i=>!i.is_enabled).map(i=>i.reg_path)}; setProfiles(updated); safeSetItem('concise_ui_profiles', JSON.stringify(updated)); setNewProfileName(""); } }} className="px-4 bg-zinc-100 text-black rounded-xl font-medium text-sm flex items-center gap-2"><Save size={16} /> {t.save}</button></div>
                  {Object.entries(profiles).map(([name, paths]) => (
                    <div key={name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl group"><div><div className="text-sm font-medium">{name}</div><div className="text-[10px] text-zinc-400">屏蔽了 {paths.length} 项</div></div><div className="flex gap-2"><button onClick={() => { const disabledPaths = profiles[name] || []; for (const item of items) { const shouldBeEnabled = !disabledPaths.includes(item.reg_path); if (item.is_enabled !== shouldBeEnabled) invoke("toggle_item", { path: item.reg_path, enable: shouldBeEnabled }); } fetchState(); setShowProfiles(false); }} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Check size={16} /></button><button onClick={() => { const updated={...profiles}; delete updated[name]; setProfiles(updated); safeSetItem('concise_ui_profiles', JSON.stringify(updated)); }} className="p-2 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button></div></div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAdding && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-2xl">
              <motion.div drag dragMomentum={false} dragConstraints={{ top: -300, bottom: 300, left: -300, right: 300 }} initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: getModalBg() }} className="absolute border border-white/10 rounded-[32px] w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
                <div className="flex justify-between items-start p-6 pb-2 shrink-0 cursor-grab active:cursor-grabbing"><div><h2 className="text-lg font-medium leading-relaxed">{t.addTitle}</h2><p className="text-xs text-zinc-300">{t.addSub}</p></div><div className="flex items-center gap-4" onPointerDownCapture={(e)=>e.stopPropagation()}><button onClick={() => setIsAdvancedMode(!isAdvancedMode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${isAdvancedMode ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-zinc-300'}`}><Code2 size={12} /> {isAdvancedMode ? t.advMode : t.simpleMode}</button><X size={18} className="cursor-pointer" onClick={() => setIsAdding(false)} /></div></div>
                <div className="flex-1 px-6 pb-8 space-y-4" onPointerDownCapture={(e)=>e.stopPropagation()}>
                  {!isAdvancedMode ? (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><CustomSelect value={simpleAction.category} onChange={v => setSimpleAction({...simpleAction, category: v})} options={[{label: t.menuBg, value: "Directory\\Background\\shell"}, {label: t.menuFile, value: "*\\shell"}, {label: t.menuFolder, value: "Directory\\shell"}]} /><input placeholder="菜单名称" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none" value={simpleAction.name} onChange={e => setSimpleAction({...simpleAction, name: e.target.value})} /><input placeholder="程序路径 (.exe)" className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm outline-none" value={simpleAction.path} onChange={e => setSimpleAction({...simpleAction, path: e.target.value})} /></motion.div>) : (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3"><div className="grid grid-cols-2 gap-3"><input placeholder="Base Path" className="w-full bg-black/40 border border-red-500/20 rounded-xl p-3 text-xs outline-none" value={advAction.basePath} onChange={e => setAdvAction({...advAction, basePath: e.target.value})} /><input placeholder="Key Name" className="w-full bg-black/40 border border-red-500/20 rounded-xl p-3 text-xs outline-none" value={advAction.keyName} onChange={e => setAdvAction({...advAction, keyName: e.target.value})} /></div><input placeholder="Display Name" className="w-full bg-black/40 border border-red-500/20 rounded-xl p-3 text-xs outline-none" value={advAction.displayName} onChange={e => setAdvAction({...advAction, displayName: e.target.value})} /><input placeholder="Command" className="w-full bg-black/40 border border-red-500/20 rounded-xl p-3 text-xs font-mono outline-none" value={advAction.command} onChange={e => setAdvAction({...advAction, command: e.target.value})} /><input placeholder="Icon Path" className="w-full bg-black/40 border border-red-500/20 rounded-xl p-3 text-xs outline-none" value={advAction.iconPath} onChange={e => setAdvAction({...advAction, iconPath: e.target.value})} /></motion.div>)}
                  <button onClick={handleAdd} className={`w-full py-4 rounded-xl font-bold text-sm mt-4 active:scale-95 ${isAdvancedMode ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>{isAdvancedMode ? t.forceDeploy : t.deploy}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}