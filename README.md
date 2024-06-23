# Tauri ZIP File Reader

## Overview
The Tauri ZIP File Reader is a desktop application built using Tauri that allows users to open and read ZIP files. The application can handle password-protected ZIP files and displays metadata and contents of the ZIP files. 

## Features
- Open and read ZIP files.
- Handle password-protected ZIP files.
- Display metadata and list the contents of the ZIP files.
- Remember recently opened ZIP files.
- Environment variable to set the directory of ZIP files.

## Setup

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/en/download/)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites#installing-tauri-cli)

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/athulkrishnaaei/linzip.git
   cd tauri-zip-reader
2. Install Rust dependencies
    cargo install
### Configuration
    Create a .env file in the project root directory with the following content:

    ZIP_FILE_DIRECTORY=/path/to/your/zip/files 


### Running the application
 cargo tauri dev

### Building application
    cd src-tauri
    cargo build --release

### Running builded application
 ./target/release/linzip

