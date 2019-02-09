const checkError = () => {
    if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
    }
};

chrome.browserAction.onClicked.addListener(tab => {
    chrome.tabs.executeScript({
        file: '/plex-download.js'
    }, checkError);
});
