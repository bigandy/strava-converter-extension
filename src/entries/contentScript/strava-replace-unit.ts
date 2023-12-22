import browser from "webextension-polyfill";
import { messages } from "../consts/messages";
import { convertPace } from "./convertPace";

browser.runtime.onMessage.addListener(function (request) {
  // listen for messages sent from background.js
  if (request.message === messages.URL_UPDATED) {
    run();
  }

  if (request.message === messages.SETTING_UPDATED) {
    run();
  }
});

function walk(rootNode: any, conversion: ConversionDirection) {
  // Find all the text nodes in rootNode
  var walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null),
    node;

  // Modify each text node's value
  while ((node = walker.nextNode())) {
    if (node.nodeType === 3) {
      // ignore text nodes
      return;
    }
    runConversion(node, conversion);
  }
}

const runConversion = (node: any, conversionDirection: ConversionDirection) => {
  const conversionTerms =
    conversionDirection === "imperial-metric"
      ? ["miles", "feet", "miles per hour", "minutes per mile"]
      : [
          "meters",
          "kilometers",
          "kilometers per hour",
          "minutes per kilometer",
        ];

  const allAbbrs = node.querySelectorAll("*:has(> abbr.unit)");
  const filteredAbbrs = [...allAbbrs]
    .map((abbr) => {
      const unit = abbr.querySelector("abbr.unit").title;

      return {
        unit,
        abbr,
      };
    })
    .filter(({ unit }) => {
      return !!conversionTerms.includes(unit);
    });

  filteredAbbrs.forEach(function ({ abbr, unit }) {
    const value = abbr.textContent
      .match(/\d+((.|,)\d+)?/)?.[0]
      .replaceAll(",", "");

    let newUnit = "";
    let newValue = "";
    let newPrefix = "";
    if (unit === "meters") {
      newValue = `${Number(value * 3.280839895).toFixed(2)}`;
      newUnit = "feet";
      newPrefix = "ft";
    } else if (unit === "kilometers") {
      newValue = `${Number(value * 0.6213712).toFixed(2)}`;
      newUnit = "miles";
      newPrefix = "mi";
    } else if (unit === "kilometers per hour") {
      newValue = `${Number(value * 0.6213712).toFixed(2)}`;
      newUnit = "miles per hour";
      newPrefix = "mi/h";
    } else if (unit === "minutes per kilometer") {
      newValue = convertPace(value, "miles");
      newUnit = "minutes per mile";
      newPrefix = "/mi";
    } else if (unit === "miles") {
      newValue = `${Number(value * 1.609344).toFixed(2)}`;
      newUnit = "kilometers";
      newPrefix = "km";
    } else if (unit === "miles per hour") {
      newValue = `${Number(value * 1.609344).toFixed(2)}`;
      newUnit = "kilometers per hour";
      newPrefix = "km/h";
    } else if (unit === "minutes per mile") {
      newValue = convertPace(value, "kilometers");
      newUnit = "minutes per kilometer";
      newPrefix = "/km";
    } else if (unit === "feet") {
      newValue = `${Number(value * 0.3048).toFixed(2)}`;
      newUnit = "meters";
      newPrefix = "m";
    }

    abbr.innerHTML = `${newValue}<abbr class="unit" title="${newUnit}">${newPrefix}</abbr>`;
  });
};

// Returns true if a node should *not* be altered in any way
function isForbiddenNode(node: any) {
  return (
    node.nodeType === 3 ||
    node.isContentEditable || // DraftJS and many others
    (node.parentNode && node.parentNode.isContentEditable) || // Special case for Gmail
    (node.tagName &&
      (node.tagName.toLowerCase() == "textarea" || // Some catch-alls
        node.tagName.toLowerCase() == "input"))
  );
}

type ConversionDirection = "imperial-metric" | "metric-imperial";

// Walk the doc (document) body and observe the body
function walkAndObserve(
  document: any,
  conversion: ConversionDirection = "metric-imperial"
) {
  runConversion(document.body, conversion);

  // THIS IS NOT WORKING AS OF NOW
  var observerConfig = {
      characterData: true,
      childList: true,
      subtree: true,
    },
    bodyObserver;

  function observerCallback(mutations: any) {
    var i, node;

    mutations.forEach(function (mutation: any) {
      for (i = 0; i < mutation.addedNodes.length; i++) {
        node = mutation.addedNodes[i];

        if (isForbiddenNode(node)) {
          // Should never operate on user-editable content
          continue;
        } else {
          console.log(node.nodeType === 3);
          // Otherwise, find text nodes within the given node and replace text
          walk(node, conversion);
        }
      }
    });
  }

  // Observe the body so that we replace text in any added/modified nodes
  bodyObserver = new MutationObserver(observerCallback);
  bodyObserver.observe(document.body, observerConfig);
}

const run = () => {
  browser.storage.sync
    .get("stravaConverterValue")
    .then(({ stravaConverterValue }) => {
      walkAndObserve(document, stravaConverterValue);
    });
};

run();

export {};
