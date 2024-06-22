document.addEventListener('DOMContentLoaded', () => {
    const { invoke } = window.__TAURI__.tauri;

    // Load recent ZIPs on startup and show welcome screen
    const recentZipsWelcome = document.getElementById('recentZipsWelcome');
    const recentZips = JSON.parse(localStorage.getItem('recentZips')) || [];

    recentZips.forEach(path => {
        const li = document.createElement('li');
        li.textContent = path;
        recentZipsWelcome.appendChild(li);
    });

    document.getElementById('proceedButton').addEventListener('click', () => {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    });

   
    document.getElementById('returnButton').addEventListener('click', () => {
        document.getElementById('app').style.display = 'none';
        document.getElementById('welcomeScreen').style.display = 'block';
        document.getElementById('returnButton').style.display = 'none';
    });


    document.getElementById('openZipButton').addEventListener('click', async () => {
        const fileInput = document.getElementById('fileInput');
        const passwordInput = document.getElementById('passwordInput');
        const metadataDiv = document.getElementById('metadata');
        const fileList = document.getElementById('fileList');
        const recentZipsList = document.getElementById('recentZips');

        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a ZIP file.');
            return;
        }

       
        const file = fileInput.files[0];
        
        // // Using for...in loop
        // for (const prop in file) {
        //     console.log(`${prop}: ${file[prop]}`);
        // }

        // // Using Object.keys
        //     Object.keys(file).forEach((key) => {
        //     console.log(`${key}: ${file[key]}`);
        // });

        const password = passwordInput.value || null;  // Convert empty string to null
        
        
        filename =fileInput.files[0].name;
        const filepath = await invoke('get_file_path', { filename });
        console.log("File path  ==  "  + filepath)
       

        try {
            // Send the file path and password to the Rust backend
            const response = await invoke('read_zip_file', { filepath: filepath, password});
            const zipData = response;
            // console.log("Zip data  " + zipData.name)
            metadataDiv.innerHTML = `
                <h2>Metadata</h2>
                <p>Name: ${filename}</p>
                <p>Size: ${zipData.size}</p>
                <p>Compressed Size: ${zipData.compressed_size}</p>
            `;
            
            fileList.innerHTML = '';
            zipData.files.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file;
                fileList.appendChild(li);
            });

            let recentZips = JSON.parse(localStorage.getItem('recentZips')) || [];
            recentZips = [filepath, ...recentZips.filter(path => path !== filepath)].slice(0, 5);
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
            alert('Error reading ZIP file or this file is password protected: ' + error);
        }
    });

    document.getElementById('addButton').addEventListener('click', async () => {
        const number1 = parseInt(document.getElementById('number1').value);
        const number2 = parseInt(document.getElementById('number2').value);
        const resultDisplay = document.getElementById('resultDisplay');

        if (isNaN(number1) || isNaN(number2)) {
            alert('Please enter valid numbers.');
            return;
        }

        try {
            const result = await invoke('perform_addition', { num1: number1, num2: number2 });
            resultDisplay.innerText = `Result: ${result}`;
        } catch (error) {
            console.error('Error adding numbers:', error);
            alert('Error adding numbers');
        }
    });

    // Load recent ZIPs on startup
    const recentZipsList = document.getElementById('recentZips');
    recentZips = JSON.parse(localStorage.getItem('recentZips')) || [];

    recentZips.forEach(path => {
        const li = document.createElement('li');
        li.textContent = path;
        recentZipsList.appendChild(li);
    });
});
