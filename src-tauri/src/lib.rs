use serde::{Deserialize, Serialize};
use std::process::Command;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State,
};
use window_vibrancy::{apply_acrylic, apply_blur, apply_mica, clear_blur};
use winreg::enums::*;
use winreg::RegKey;

// 记录当前生效的渲染状态，防止高频调用导致系统卡顿
struct AppState {
    current_effect: Mutex<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ContextItem {
    id: String,
    name: String,
    reg_path: String,
    is_enabled: bool,
    category: String,
}

#[tauri::command]
fn show_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        // 移除 set_focus，防止程序在后台偷偷抢占置顶位置
    }
}

#[tauri::command]
fn minimize_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
}

#[tauri::command]
fn hide_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn exit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn is_admin() -> bool {
    let hkcr = RegKey::predef(HKEY_CLASSES_ROOT);
    hkcr.open_subkey_with_flags("Directory\\shell", KEY_WRITE)
        .is_ok()
}

#[tauri::command]
fn update_tray_menu(app: AppHandle, lang: String) {
    let show_txt = if lang == "en" {
        "Show Window"
    } else {
        "显示窗口"
    };
    let min_txt = if lang == "en" {
        "Minimize"
    } else {
        "最小化"
    };
    let set_txt = if lang == "en" {
        "Settings"
    } else {
        "偏好设置"
    };
    let quit_txt = if lang == "en" { "Exit" } else { "彻底退出" };

    if let Some(tray) = app.tray_by_id("main_tray") {
        if let (Ok(show_i), Ok(min_i), Ok(set_i), Ok(quit_i)) = (
            MenuItem::with_id(&app, "show", show_txt, true, None::<&str>),
            MenuItem::with_id(&app, "minimize", min_txt, true, None::<&str>),
            MenuItem::with_id(&app, "settings", set_txt, true, None::<&str>),
            MenuItem::with_id(&app, "quit", quit_txt, true, None::<&str>),
        ) {
            if let Ok(menu) = Menu::with_items(&app, &[&show_i, &min_i, &set_i, &quit_i]) {
                let _ = tray.set_menu(Some(menu));
            }
        }
    }
}

// 修复 1：核心状态锁，彻底解决 DWM 卡顿
#[tauri::command]
fn update_window_effect(effect: String, app: AppHandle, state: State<'_, AppState>) {
    let mut current = state.current_effect.lock().unwrap();

    // 如果请求的材质和当前一致，直接返回，绝不骚扰系统内核
    if *current == effect {
        return;
    }

    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "windows")]
        {
            let _ = clear_blur(&window);
            match effect.as_str() {
                "acrylic" => {
                    let _ = apply_acrylic(&window, Some((0, 0, 0, 0)));
                }
                "blur" => {
                    let _ = apply_blur(&window, Some((0, 0, 0, 0)));
                }
                _ => {
                    let _ = apply_mica(&window, Some(true));
                }
            }
            *current = effect; // 更新状态记录
        }
    }
}

#[tauri::command]
fn get_system_fonts() -> Vec<String> {
    let mut fonts = Vec::new();
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    if let Ok(key) = hklm.open_subkey("SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts") {
        for (name, _) in key.enum_values().filter_map(Result::ok) {
            let clean_name = name.replace(" (TrueType)", "").replace(" (OpenType)", "");
            fonts.push(clean_name);
        }
    }
    fonts.sort();
    fonts.dedup();
    fonts
}

fn scan_registry_path(base_path: &str, category: &str) -> Vec<ContextItem> {
    let mut items = Vec::new();
    let hkcr = RegKey::predef(HKEY_CLASSES_ROOT);
    if let Ok(key) = hkcr.open_subkey(base_path) {
        for name in key.enum_keys().filter_map(Result::ok) {
            if name.to_lowercase() == "find" || name.to_lowercase() == "cmd" {
                continue;
            }
            if let Ok(sub_key) = key.open_subkey(&name) {
                let display: String = sub_key.get_value("").unwrap_or(name.clone());
                items.push(ContextItem {
                    id: format!("{}_{}", category, name),
                    name: display,
                    reg_path: format!("{}\\{}", base_path, name),
                    is_enabled: sub_key.get_value::<String, _>("LegacyDisable").is_err(),
                    category: category.to_string(),
                });
            }
        }
    }
    items
}

#[tauri::command]
fn scan_menu() -> Vec<ContextItem> {
    let mut all_items = Vec::new();
    all_items.extend(scan_registry_path("*\\shell", "文件/File"));
    all_items.extend(scan_registry_path("Directory\\shell", "文件夹/Folder"));
    all_items.extend(scan_registry_path(
        "Directory\\Background\\shell",
        "空白背景/Background",
    ));
    all_items
}

#[tauri::command]
fn toggle_item(path: String, enable: bool) -> Result<(), String> {
    let hkcr = RegKey::predef(HKEY_CLASSES_ROOT);
    let key = hkcr
        .open_subkey_with_flags(&path, KEY_WRITE)
        .map_err(|e| e.to_string())?;
    if enable {
        let _ = key.delete_value("LegacyDisable");
    } else {
        key.set_value("LegacyDisable", &"")
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn add_custom_action(
    base_path: String,
    key_name: String,
    display_name: String,
    command: String,
    icon_path: String,
) -> Result<(), String> {
    let hkcr = RegKey::predef(HKEY_CLASSES_ROOT);
    let path = format!("{}\\{}", base_path, key_name);
    let (key, _) = hkcr.create_subkey(&path).map_err(|e| e.to_string())?;
    key.set_value("", &display_name)
        .map_err(|e| e.to_string())?;
    if !icon_path.trim().is_empty() {
        let _ = key.set_value("Icon", &icon_path);
    }
    let (cmd_key, _) = key.create_subkey("command").map_err(|e| e.to_string())?;
    cmd_key.set_value("", &command).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn restart_explorer() {
    let _ = Command::new("taskkill")
        .args(["/f", "/im", "explorer.exe"])
        .status();
    let _ = Command::new("explorer.exe").spawn();
}

#[tauri::command]
fn check_win11_classic() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    hkcu.open_subkey(
        "Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32",
    )
    .is_ok()
}

#[tauri::command]
fn toggle_win11_classic(enable: bool) -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let path = "Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}";
    if enable {
        let (key, _) = hkcu.create_subkey(path).map_err(|e| e.to_string())?;
        let (inproc, _) = key
            .create_subkey("InprocServer32")
            .map_err(|e| e.to_string())?;
        inproc.set_value("", &"").map_err(|e| e.to_string())?;
    } else {
        let _ = hkcu.delete_subkey_all(path);
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            current_effect: Mutex::new("none".into()),
        }) // 初始化材质锁
        .setup(|app| {
            let show_i = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let min_i = MenuItem::with_id(app, "minimize", "最小化", true, None::<&str>)?;
            let set_i = MenuItem::with_id(app, "settings", "偏好设置", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "彻底退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &min_i, &set_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("main_tray")
                .tooltip("concise ui")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "minimize" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.minimize();
                        }
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                            let _ = window.emit("open-settings", ());
                        }
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::DoubleClick {
                        button: MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_menu,
            toggle_item,
            add_custom_action,
            is_admin,
            get_system_fonts,
            show_window,
            minimize_window,
            hide_window,
            exit_app,
            update_tray_menu,
            restart_explorer,
            check_win11_classic,
            toggle_win11_classic,
            update_window_effect
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
