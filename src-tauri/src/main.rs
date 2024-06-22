use std::process::Command;
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
fn read_zip_file(filepath: String, password: Option<String>) -> Result<ZipFileMetadata, String> {
    if let Some(pwd) = password {
        // Handle password-protected ZIP file using unzip command
        let output = Command::new("unzip")
            .arg("-l")
            .arg("-P")
            .arg(&pwd)
            .arg(&filepath)
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let files: Vec<String> = stdout.lines()
                .skip(3) // Skip the first three lines which are headers
                .filter_map(|line| {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() > 3 {
                        Some(parts[3..].join(" "))
                    } else {
                        None
                    }
                })
                .collect();

            let compressed_size: u64 = files.iter().map(|_| 0u64).sum(); // Placeholder for compressed size

            let metadata = ZipFileMetadata {
                name: filepath.clone(),
                size: files.len() as u64,
                compressed_size,
                files,
            };

            Ok(metadata)
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(stderr.to_string())
        }
    } else {
        // Handle non-password-protected ZIP file using the zip crate
        let file = File::open(filepath).map_err(|e| e.to_string())?;
        let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

        let mut files = Vec::new();

        for i in 0..archive.len() {
            let file = archive.by_index(i).map_err(|e| e.to_string())?;
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
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_zip_file, perform_addition, greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
