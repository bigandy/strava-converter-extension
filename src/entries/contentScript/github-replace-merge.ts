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

// const replaceImages = () => {
//   const images = document.getElementsByTagName("img");

//   const imgURL = browser.runtime.getURL("icons/hoof-it_128.png");

//   // replace all images with hoof-it image
//   for (let i = 0; i < images.length; i++) {
//     const prevSrc = images[i].src;
//     images[i].src = imgURL;
//     images[i].dataset.origSrc = prevSrc;
//   }
// };

// const resetImages = () => {
//   const images = document.getElementsByTagName("img");

//   // replace all hoof-it images with original image
//   for (let i = 0; i < images.length; i++) {
//     const prevSrc = images[i].dataset.origSrc;
//     if (prevSrc) {
//       images[i].src = prevSrc;
//     }
//   }
// };

function walk(rootNode: any, forwards: boolean) {
  // Find all the text nodes in rootNode
  var walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null),
    node;

  // Modify each text node's value
  while ((node = walker.nextNode())) {
    handleText(node, forwards);
  }
}

function handleText(textNode: any, forwards: boolean) {
  textNode.nodeValue = replaceText(textNode.nodeValue, forwards);
}

function replaceText(v: any, forwards: boolean) {
  // if (forwards) {
  //   v = v.replaceAll("Merge", "Hoof");
  //   v = v.replaceAll("Merging", "Hoofing");
  //   v = v.replaceAll("merge", "hoof");
  // } else {
  //   v = v.replaceAll("Hoof", "Merge");
  //   v = v.replaceAll("Hoofing", "Merging");
  //   v = v.replaceAll("hoof", "merge");
  // }

  return v;
}

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

// Walk the doc (document) body and observe the body
function walkAndObserve(doc: any, forwards: boolean) {
  var observerConfig = {
      characterData: true,
      childList: true,
      subtree: true,
    },
    bodyObserver;

  // Do the initial text replacements in the document body
  walk(doc.body, forwards);

  // The callback used for the document body and title observers
  function observerCallback(mutations: any) {
    var i, node;

    mutations.forEach(function (mutation: any) {
      for (i = 0; i < mutation.addedNodes.length; i++) {
        node = mutation.addedNodes[i];
        if (isForbiddenNode(node)) {
          // Should never operate on user-editable content
          continue;
        } else if (node.nodeType === 3) {
          // Replace the text for text nodes
          handleText(node, forwards);
        } else {
          // Otherwise, find text nodes within the given node and replace text
          walk(node, forwards);
        }
      }
    });
  }

  // Observe the body so that we replace text in any added/modified nodes
  bodyObserver = new MutationObserver(observerCallback);
  bodyObserver.observe(doc.body, observerConfig);
}

const run = () => {
  browser.storage.sync
    .get("stravaConverValue")
    .then(({ stravaConverValue }) => {
      if (stravaConverValue === "all" || stravaConverValue === "text") {
        walkAndObserve(document, true);
      } else {
        walkAndObserve(document, false);
      }
      // if (hoofItValue === "all") {
      //   replaceImages();
      // } else {
      //   resetImages();
      // }
    });
};

run();

export {};
