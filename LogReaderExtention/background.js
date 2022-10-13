"use strict"

chrome.webNavigation.onCompleted.addListener((e) => {
	console.log("e:"+e);
	chrome.tabs.executeScript(e.tabId, {file: "inject.js"}, result => {
        const lastErr = chrome.runtime.lastError;
		if(lastErr){
			console.log("error");
		}
    });
});