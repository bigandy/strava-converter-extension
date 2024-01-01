import browser from "webextension-polyfill";
import { messages } from "../consts/messages";

document.addEventListener("click", async (e) => {
  console.log("clicked");
  const { target } = e;

  if (!target) {
    return;
  }
  if (target instanceof HTMLElement) {
    // check if item is a abbr.unit or the parent of abbr.unit
    if (
      (target.tagName === "ABBR" && target.classList.contains("unit")) ||
      target.querySelector("abbr.unit")
    ) {
      console.log("is an abbr.unit, or parent of one");

      await browser.runtime.sendMessage({
        message: messages.UNIT_TOGGLED,
      });
    }
  }
});

export {};
