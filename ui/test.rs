use tauri::command;
use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;
use zip::read::ZipArchive;
use zip::result::ZipError;
use serde::Serialize;

#[derive(Debug, Serialize)]
struct ZipFileMetadata {
    name: String,
    size: u64,
    compressed_size: u64,
    files: Vec<String>,
}

#[command]
fn unzip_file(file_path: String, password: Option<String>, output_dir: String) -> Result<ZipFileMetadata, String> {
    let file = File::open(&file_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
    
    let mut files = Vec::new();
    let password_bytes = password.as_deref().map(|s| s.as_bytes());

    for i in 0..archive.len() {
        let mut file = match password_bytes {
            Some(pwd) => archive.by_index_decrypt(i, pwd).map_err(|e| match e {
                ZipError::UnsupportedArchive(..) => "Invalid password or unsupported archive".to_string(),
                _ => e.to_string(),
            })?,
            None => archive.by_index(i).map_err(|e| e.to_string())?,
        };

        let outpath = Path::new(&output_dir).join(file.name());
        if file.name().ends_with('/') {
            std::fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
                }
            }
            let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
        files.push(file.name().to_string());
    }

    let compressed_size: u64 = (0..archive.len())
        .map(|i| archive.by_index(i).map(|f| f.compressed_size()).unwrap_or(0))
        .sum();

    let metadata = ZipFileMetadata {
        name: file_path,
        size: archive.len() as u64,
        compressed_size,
        files,
    };

    Ok(metadata)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![unzip_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
