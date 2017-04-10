var $ = function (id) {
    return document.getElementById(id);
};

var present = function () {
    // Injected script
    chrome.devtools.inspectedWindow.eval('window.siqiExtension = true', {
        useContentScriptContext: true
    });
};

document.addEventListener('DOMContentLoaded', function () {
    // Document of the panel page is ready
});

// Create a connection to the background page
var backgroundPageConnection = chrome.runtime.connect({
    name: 'panel'
});

// Send a message to the background page
backgroundPageConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId,
    scriptToInject: 'contentScript.js' // Content script
});

backgroundPageConnection.onMessage.addListener(function (message) {
    // Incoming message from the background page
    
    return true;
});