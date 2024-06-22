use tauri::command;
use std::fs::File;
use zip::read::ZipArchive;
use zip::result::ZipError;
use serde::Serialize;
use serde::Deserialize;

#[derive(Deserialize)]

#[derive(Debug, Serialize)]
struct ZipFileMetadata {
    name: String,
    size: u64,
    compressed_size: u64,
    files: Vec<String>,
}

#[command]
fn greet() -> String {
    "Hello from Rust!".into()
}

#[command]
fn perform_addition(num1: f64, num2: f64) -> f64 {
    num1 + num2
}

#[command]
fn read_zip_file(filepath: String,password: Option<String>) -> Result<ZipFileMetadata, String> {
    
    // let ReadZipFileArgs { filepath, password } = args;
    print!("{}",filepath);
    let file = File::open(filepath).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    let mut files = Vec::new();
    let password_bytes = password.as_deref().map(|s| s.as_bytes());

    for i in 0..archive.len() {
        let file_result = match password_bytes {
            Some(pwd) => archive.by_index_decrypt(i, pwd).map_err(|e| match e {
                ZipError::UnsupportedArchive(..) => "Invalid password or unsupported archive".to_string(),
                _ => e.to_string(),
            })?,
            None => Ok(archive.by_index(i).map_err(|e| e.to_string())?),
        };
        let file = file_result.map_err(|e| e.to_string())?;
        files.push(file.name().to_string());
    }

    let compressed_size: u64 = (0..archive.len())
        .map(|i| archive.by_index(i).map(|f| f.compressed_size()).unwrap_or(0))
        .sum();

    let metadata = ZipFileMetadata {
        name: String::from_utf8_lossy(archive.comment()).to_string(),
        size: archive.len() as u64,
        compressed_size,
        files,
    };

    Ok(metadata)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_zip_file, perform_addition, greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
