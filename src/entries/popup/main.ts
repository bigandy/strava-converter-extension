import browser from "webextension-polyfill";

import "../styles/style.css";

const form = document.querySelector("#settings");

form?.addEventListener("change", (e: any) => {
  browser.storage.sync.set({ stravaConverterValue: e.target.id });
});

const getSettings = () => {
  browser.storage.sync
    .get("stravaConverterValue")
    .then(({ stravaConverterValue }) => {
      // @ts-ignore
      document.getElementById(stravaConverterValue).checked = true;
    });
};

document.addEventListener("DOMContentLoaded", function () {
  getSettings();
});
