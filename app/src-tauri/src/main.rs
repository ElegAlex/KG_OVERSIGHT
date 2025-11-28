// KG-Oversight - Application Tauri
// Prévention de la console sur Windows en release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("Erreur lors du lancement de l'application");
}
