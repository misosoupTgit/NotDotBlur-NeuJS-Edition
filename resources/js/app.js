// Neutralinojs initialization
Neutralino.init();

/**
 * @description Converts a Base64 string to a Uint8Array for binary file writing.
 * @param {string} base64 - The Base64 string (without data URL prefix).
 * @returns {Uint8Array} The binary data array.
 */
function base64ToUint8Array(base64) {
    // Decode the Base64 string to a binary string
    const binaryString = atob(base64); 
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    // Fill the byte array with character codes
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// --- Multilingual Dictionary ---
const translations = {
    "ja": {
        "title": "NotDotBlur",
        "main_title": "NotDotBlur",
        "scale_label": "拡大倍率:",
        "select_button": "画像を選択",
        "select_file_title": "画像ファイルを選択",
        "save_file_title": "拡大画像の保存先を選択",
        "error_invalid_scale": "倍率には1以上の整数を入力してください。",
        "error_scale_min": "倍率は1以上である必要があります",
        "info_supported_formats": "PNG、JPG、JPEG、GIF、BMPファイルをサポートしています",
        "success_saved": "拡大画像を保存しました:",
        "loading": "読み込み中...",
        "status_select": "画像ファイルを選択中...",
        "status_process": "画像を読み込み、拡大処理を実行中...",
        "status_cancel_select": "ファイル選択がキャンセルされました。",
        "status_cancel_save": "保存がキャンセルされました。",
        "status_error_load": "エラー: 画像の読み込みに失敗しました。",
        "status_error_major": "重大なエラーが発生しました:",
        "error_unsupported_ext": "エラー: サポートされていないファイル形式 (.${ext}) です。",
        "error_empty_file": "ファイルの内容が空です。ファイルが破損しているか、読み込みに失敗しました。",
        "error_base64_encode": "外部コマンドによるBase64データ取得中にエラーが発生しました。"
    },
    "en": {
        "title": "NotDotBlur",
        "main_title": "NotDotBlur",
        "scale_label": "Scale Factor:",
        "select_button": "Select Image",
        "select_file_title": "Select Image File",
        "save_file_title": "Select Save Location",
        "error_invalid_scale": "Please enter an integer of 1 or greater for the scale factor.",
        "error_scale_min": "Scale factor must be 1 or greater",
        "info_supported_formats": "Supports PNG, JPG, JPEG, GIF, BMP files",
        "success_saved": "Enlarged image saved:",
        "loading": "Loading...",
        "status_select": "Selecting image file...",
        "status_process": "Loading image and performing enlargement...",
        "status_cancel_select": "File selection was cancelled.",
        "status_cancel_save": "Saving was cancelled.",
        "status_error_load": "Error: Failed to load image.",
        "status_error_major": "A major error occurred:",
        "error_unsupported_ext": "Error: Unsupported file format (.${ext}).",
        "error_empty_file": "File content is empty. The file may be corrupt or failed to load.",
        "error_base64_encode": "Error occurred while fetching Base64 data via external command."
    }
};

let currentLanguage = "ja";
const elements = {};

/**
 * @description Retrieves translated text based on the current language.
 * @param {string} key - The key for the translation dictionary.
 * @returns {string} The translated string.
 */
function getText(key) {
    return translations[currentLanguage][key] || key;
}

/**
 * @description Updates all static UI texts based on the current language.
 */
function updateUITexts() {
    document.getElementById('app-title').textContent = getText('title');
    elements.titleLabel.textContent = getText('main_title');
    elements.scaleLabel.textContent = getText('scale_label');
    elements.selectButton.textContent = getText('select_button');
    elements.infoLabel.textContent = getText('info_supported_formats');

    document.querySelectorAll('.lang-button').forEach(btn => {
        if (btn.id === `${currentLanguage}-button`) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * @description Changes the application language and updates the UI.
 * @param {('ja'|'en')} lang - The new language code.
 */
function changeLanguage(lang) {
    currentLanguage = lang;
    updateUITexts();
}

/**
 * @description Sets up all event listeners and initial configurations on DOM load.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Log message reflecting the final state
    console.log("--- Application Start (Final Version with Clean Exit) ---"); 

    // 1. Get all necessary UI elements
    elements.titleLabel = document.getElementById('title-label');
    elements.scaleLabel = document.getElementById('scale-label');
    elements.scaleInput = document.getElementById('scale-factor');
    elements.selectButton = document.getElementById('select-image-button');
    elements.infoLabel = document.getElementById('info-label');
    elements.statusText = document.getElementById('status-text');
    
    // 2. Set up Event Listeners
    
    // Button click: Start image processing
    if (elements.selectButton) {
        elements.selectButton.addEventListener('click', selectAndEnlargeImage);
    }

    // Language buttons
    const jaButton = document.getElementById('ja-button');
    const enButton = document.getElementById('en-button');
    if (jaButton) {
        jaButton.addEventListener('click', () => changeLanguage('ja'));
    }
    if (enButton) {
        enButton.addEventListener('click', () => changeLanguage('en'));
    }

    // HOLD: Prevent default context menu (right-click)
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault(); 
        console.log("INFO: Context menu blocked.");
    });
    
    // HOLD: Prevent Ctrl+Wheel zoom (Robustness fix)
    document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            console.log("INFO: Ctrl+Wheel zoom blocked.");
        }
    }, { passive: false }); 

    // 3. Initial UI update
    updateUITexts();
    console.log("INFO: Neutralinojs Core Loaded. DOM Content Loaded.");
});


/**
 * @description Performs nearest neighbor scaling (pixel duplication) on an image.
 * @param {HTMLImageElement} img - The original image element.
 * @param {number} scale - The integer scale factor (>= 1).
 * @returns {string} The scaled image data as a PNG Data URL.
 */
function enlargeImageOptimized(img, scale) {
    console.log(`LOG: Processing image. Size: ${img.naturalWidth}x${img.naturalHeight}, Scale: ${scale}`);
    
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const newWidth = width * scale;
    const newHeight = height * scale;

    const canvas = document.getElementById('processing-canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');

    // Draw original image onto a temporary canvas to get pixel data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0);
    const originalData = tempCtx.getImageData(0, 0, width, height);
    const originalPixels = originalData.data;

    // Create ImageData for the new, scaled image
    const newImageData = ctx.createImageData(newWidth, newHeight);
    const newPixels = newImageData.data;

    // Nearest Neighbor algorithm loop
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const originalIndex = (y * width + x) * 4;
            const R = originalPixels[originalIndex];
            const G = originalPixels[originalIndex + 1];
            const B = originalPixels[originalIndex + 2];
            const A = originalPixels[originalIndex + 3];

            // Duplicate the pixel (R, G, B, A) across the scale x scale block
            for (let dy = 0; dy < scale; dy++) {
                for (let dx = 0; dx < scale; dx++) {
                    const newIndex = ((y * scale + dy) * newWidth + (x * scale + dx)) * 4;
                    newPixels[newIndex] = R;
                    newPixels[newIndex + 1] = G;
                    newPixels[newIndex + 2] = B;
                    newPixels[newIndex + 3] = A;
                }
            }
        }
    }

    ctx.putImageData(newImageData, 0, 0);
    console.log("LOG: Scaling complete. New Canvas Data generated.");
    // Return the result as a PNG Data URL
    return canvas.toDataURL('image/png');
}

// --- Main Logic for File Selection and Processing ---

async function selectAndEnlargeImage() {
    elements.statusText.textContent = "";

    try {
        // 1. Validate Scale Factor
        const scaleFactor = parseInt(elements.scaleInput.value);
        if (isNaN(scaleFactor) || scaleFactor < 1) {
            const errMsg = getText('error_invalid_scale');
            Neutralino.os.showMessageBox("Error", errMsg, 'OK', 'ERROR');
            elements.statusText.textContent = errMsg;
            return;
        }

        // 2. Select Input File
        elements.statusText.textContent = getText('status_select');
        const dialogResponse = await Neutralino.os.showOpenDialog(
            getText('select_file_title'), 
            {
                filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp'] }],
                multiSelections: false 
            }
        );
        
        const filePath = dialogResponse.length > 0 ? dialogResponse[0] : null;

        if (!filePath) {
            elements.statusText.textContent = getText('status_cancel_select');
            console.log("LOG: File selection cancelled by user.");
            return;
        }

        elements.statusText.textContent = getText('status_process');
        console.log(`LOG: Selected file path: ${filePath}`);

        // 3. Determine MIME Type and Extension
        const ext = filePath.split('.').pop().toLowerCase();
        let mimeType = ''; 

        if (['jpg', 'jpeg'].includes(ext)) {
            mimeType = 'image/jpeg';
        } else if (ext === 'png') {
            mimeType = 'image/png';
        } else if (ext === 'gif') {
            mimeType = 'image/gif';
        } else if (ext === 'bmp') {
            mimeType = 'image/bmp';
        } else {
            const errMsg = getText('error_unsupported_ext').replace('${ext}', ext);
            elements.statusText.textContent = errMsg;
            Neutralino.os.showMessageBox("Error", errMsg, 'OK', 'ERROR');
            return;
        }

        // 4. Read File Content as Base64 using PowerShell (Robustness Improvement)
        let rawBase64 = '';
        try {
            // PowerShell command: Read file as bytes and encode to Base64 string
            const psCommand = `[System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes('${filePath}'))`;
            
            const commandResult = await Neutralino.os.execCommand(`powershell.exe -Command "${psCommand}"`, { background: false });

            if (commandResult.exitCode !== 0) {
                 throw new Error(`PowerShell command failed: ${commandResult.stdErr || commandResult.stdOut}`);
            }

            // Get Base64 string and remove newlines/extra spaces
            rawBase64 = commandResult.stdOut.trim(); 
            
            if (!rawBase64 || rawBase64.length === 0) {
                 throw new Error(getText('error_empty_file'));
            }
            
            console.log(`LOG: Base64 reading via PowerShell successful. Length: ${rawBase64.length}`);
            
        } catch (e) {
             console.error("ERROR: Base64 reading failed:", e);
             const errMsg = getText('error_base64_encode') + `: ${e.message}`;
             elements.statusText.textContent = errMsg;
             Neutralino.os.showMessageBox("Error", errMsg, 'OK', 'ERROR');
             return;
        }
        
        const dataUrl = `data:${mimeType};base64,${rawBase64}`;

        // 5. Load Image Object
        const img = new Image();
        
        img.onerror = () => {
            console.error("ERROR: Image object failed to load from Data URL.");
            elements.statusText.textContent = getText('status_error_load');
            Neutralino.os.showMessageBox("Error", `Image loading failed. Data URL might be invalid.`, 'OK', 'ERROR');
        };

        // --- Image Load Success & Scaling (Step 6) ---
        img.onload = async () => {
            console.log("LOG: Image loaded successfully. Proceeding to scaling.");
            
            let enlargedDataUrl = '';
            let base64DataToSave = '';
            
            try {
                // Perform the optimized nearest neighbor scaling
                enlargedDataUrl = enlargeImageOptimized(img, scaleFactor);
                // Extract only the Base64 part for saving
                base64DataToSave = enlargedDataUrl.split(',')[1];
                
                if (!base64DataToSave) {
                    throw new Error("Failed to extract Base64 data from canvas output.");
                }

            } catch (e) {
                 console.error("ERROR: Scaling or Canvas conversion failed:", e);
                 elements.statusText.textContent = `Scaling Error: ${e.message}`;
                 return;
            }
            
            // 7. Select Output File Path
            const originalFileName = filePath.split(/[/\\]/).pop().replace(/\.[^/\\\.]+$/, "");
            const originalWidth = img.naturalWidth;
            const originalHeight = img.naturalHeight;
            const newWidth = originalWidth * scaleFactor;
            const newHeight = originalHeight * scaleFactor;

            const defaultFileName = 
                `${originalFileName}-x${scaleFactor}-${newWidth}x${newHeight}.png`;
            
            const saveDialogResponse = await Neutralino.os.showSaveDialog(
                getText('save_file_title'),
                {
                    filters: [{ name: 'PNG files', extensions: ['png'] }],
                    defaultPath: defaultFileName
                }
            );

            const savePath = saveDialogResponse;
            if (!savePath) {
                elements.statusText.textContent = getText('status_cancel_save');
                return;
            }

            // 8. Save File (Write Binary Data)
            try {
                // Decode Base64 string to Uint8Array for binary writing
                const bytesToSave = base64ToUint8Array(base64DataToSave);
                
                // Use Neutralino's binary file writing for robust saving
                await Neutralino.filesystem.writeBinaryFile(savePath, bytesToSave);
            
                elements.statusText.textContent = `${getText('success_saved')} ${savePath}`;
                console.log(`LOG: Enlarged image successfully saved to: ${savePath}`);

            } catch (e) {
                 console.error("ERROR: Binary file writing failed:", e);
                 const errMsg = `Saving Error: ${e.message}`;
                 elements.statusText.textContent = `${errMsg}`;
                 Neutralino.os.showMessageBox("Error", errMsg, 'OK', 'ERROR');
            }
        };

        img.src = dataUrl;
        
    } catch (error) {
        // Catch major or unexpected errors in the process flow
        console.error(`FATAL ERROR: Unexpected error occurred: ${error.message}`, error);
        const errorMessage = `${getText('status_error_major')} ${error.message}`;
        elements.statusText.textContent = errorMessage;
        Neutralino.os.showMessageBox("Error", errorMessage, 'OK', 'ERROR');
    }
}