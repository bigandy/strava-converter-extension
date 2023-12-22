import browser from "webextension-polyfill";
import { messages } from "../consts/messages";

browser.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  // read changeInfo data and do something with it
  // like send the new url to contentscripts.js
  if (changeInfo.status === "complete") {
    browser.tabs.sendMessage(tabId, {
      message: messages.URL_UPDATED,
    });
  }
});

browser.runtime.onInstalled.addListener(() => {
  browser.storage.sync.get(["stravaConverterValue"]).then((result) => {
    if (!result.stravaConverterValue) {
      // console.log("no strava converter value");
      browser.storage.sync.set({
        stravaConverterValue: "all",
      });
    }
  });
});

browser.storage.onChanged.addListener(function (changes, area) {
  console.log(changes, area);
  if (
    area === "sync" &&
    changes.stravaConverterValue?.newValue !==
      changes.stravaConverterValue?.oldValue
  ) {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(function (tabs) {
        // @ts-ignore
        browser.tabs.sendMessage(tabs[0].id, {
          message: messages.SETTING_UPDATED,
          value: changes.stravaConverterValue?.newValue,
        });
      });
  }
});
