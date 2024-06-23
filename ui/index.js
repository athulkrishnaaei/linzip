let selectedFilePath = "";
let zipName = "";

const getFileName = (filePath) => {
    const match = filePath.match(/([^\/\\]+\.zip)$/i);
    return match ? match[1] : null;
};

document.addEventListener('DOMContentLoaded', () => {
    const { invoke } = window.__TAURI__.tauri;
    const { open } = window.__TAURI__.dialog;

    // Load recent ZIPs on startup and show welcome screen
    const recentZipsWelcome = document.getElementById('recentZipsWelcome');
    const recentZipsList = document.getElementById('recentZips');
    let recentZips = JSON.parse(localStorage.getItem('recentZips')) || [];

    recentZips.forEach(path => {
        const li = document.createElement('li');
        li.textContent = path;
        recentZipsWelcome.appendChild(li);
        const recentLi = document.createElement('li');
        recentLi.textContent = path;
        recentZipsList.appendChild(recentLi);
    });

    document.getElementById('proceedButton').addEventListener('click', () => {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('returnButton').style.display = 'block';
    });

    document.getElementById('returnButton').addEventListener('click', () => {
        document.getElementById('app').style.display = 'none';
        document.getElementById('welcomeScreen').style.display = 'block';
        document.getElementById('returnButton').style.display = 'none';
    });

    document.getElementById('openFileButton').addEventListener('click', async () => {
        try {
            const filepath = await open();
            if (filepath) {
                selectedFilePath = filepath;
                zipName = getFileName(selectedFilePath);

                document.getElementById('selectedFileName').innerText = `Selected file: ${zipName}`;
                console.log(`Selected file: ${zipName}`);
            } else {
                alert('No file selected');
            }
        } catch (error) {
            console.error('Error selecting file:', error);
        }
    });

    document.getElementById('openZipButton').addEventListener('click', async () => {
        const passwordInput = document.getElementById('passwordInput');
        const metadataDiv = document.getElementById('metadata');
        const fileList = document.getElementById('fileList');

        if (!selectedFilePath) {
            alert('Please select a ZIP file.');
            return;
        }

        const password = passwordInput.value || null; // Convert empty string to null
        const filename = selectedFilePath;

        try {
            // Send the file path and password to the Rust backend
            const response = await invoke('read_zip_file', { filepath: filename, password: password });
            const zipData = response;

            metadataDiv.innerHTML = `
                <h2>Metadata</h2>
                <p>Name: ${zipName}</p>
                <p>Size: ${zipData.size}</p>
                <p>Compressed Size: ${zipData.compressed_size}</p>
            `;

            fileList.innerHTML = '';
            zipData.files.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file;
                fileList.appendChild(li);
            });

            recentZips = [selectedFilePath, ...recentZips.filter(path => path !== selectedFilePath)].slice(0, 5);
            localStorage.setItem('recentZips', JSON.stringify(recentZips));

            recentZipsList.innerHTML = '';
            recentZips.forEach(path => {
                const li = document.createElement('li');
                li.textContent = path;
                recentZipsList.appendChild(li);
            });

            // Show the return button only after successfully unzipping
            document.getElementById('returnButton').style.display = 'block';
        } catch (error) {
            console.error('Error reading ZIP file or this file is password protected:', error);
            alert('This file is password protected: ' + error);
        }
    });
});
