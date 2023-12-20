import browser from "webextension-polyfill";
import { messages } from "../consts/messages";

browser.runtime.onMessage.addListener(function (request) {
  // listen for messages sent from background.js
  if (request.message === messages.URL_UPDATED) {
    run();
  }

  if (request.message === messages.SETTING_UPDATED) {
    run();
  }
});

function walk(rootNode: any, conversion: Conversion) {
  // Find all the text nodes in rootNode
  var walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null),
    node;

  // Modify each text node's value
  while ((node = walker.nextNode())) {
    runConversion(node, conversion);
  }
}

const runConversion = (node: any, conversion: Conversion) => {
  const conversionTerms =
    conversion === "imperial-metric"
      ? ["miles", "feet", "miles per hour"]
      : ["meters", "kilometers", "kilometers per hour"];
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
    const value = abbr.textContent.match(/\d+((.|,)\d+)?/)?.[0];
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
    } else if (unit === "miles") {
      newValue = `${Number(value * 1.609344).toFixed(2)}`;
      newUnit = "kilometers";
      newPrefix = "km";
    } else if (unit === "miles per hour") {
      newValue = `${Number(value * 1.609344).toFixed(2)}`;
      newUnit = "kilometers per hour";
      newPrefix = "km/h";
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
    node.isContentEditable || // DraftJS and many others
    (node.parentNode && node.parentNode.isContentEditable) || // Special case for Gmail
    (node.tagName &&
      (node.tagName.toLowerCase() == "textarea" || // Some catch-alls
        node.tagName.toLowerCase() == "input"))
  );
}

type Conversion = "imperial-metric" | "metric-imperial";

// Walk the doc (document) body and observe the body
function walkAndObserve(
  document: any,
  conversion: Conversion = "metric-imperial"
) {
  runConversion(document.body, conversion);

  // THIS IS NOT WORKING AS OF NOW
  var observerConfig = {
      characterData: true,
      childList: true,
      subtree: true,
    },
    bodyObserver;

  // Do the initial text replacements in the document body
  // walk(doc.body, forwards);

  function observerCallback(mutations: any) {
    var i, node;

    mutations.forEach(function (mutation: any) {
      for (i = 0; i < mutation.addedNodes.length; i++) {
        node = mutation.addedNodes[i];

        console.log({ node });
        if (isForbiddenNode(node)) {
          // Should never operate on user-editable content
          continue;
        } else if (node.nodeType === 3) {
          // Replace the text for text nodes
          // handleText(node, forwards);
        } else {
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
