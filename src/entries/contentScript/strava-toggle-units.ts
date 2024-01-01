import browser from "webextension-polyfill";
import { messages } from "../consts/messages";

document.addEventListener("click", async (e) => {
  console.log("clicked");
  if (!e.target) {
    return;
  }
  // check if item is a abbr.unit or the parent of abbr.unit
  if (
    (e.target.tagName === "ABBR" && e.target.classList.contains("unit")) ||
    e.target.querySelector("abbr.unit")
  ) {
    console.log("is an abbr.unit, or parent of one");

    await browser.runtime.sendMessage({
      message: messages.UNIT_TOGGLED,
    });
  }
});

export {};
