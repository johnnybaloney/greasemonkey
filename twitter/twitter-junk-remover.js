// ==UserScript==
// @name          Twitter - Junk Remover
// @description   Removes right panel full of junk. Widens the central feed. Removes 'See more' and '...follows' junk in main feed.
// @namespace     https://github.com/johnnybaloney
// @require       https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @include       https://twitter.com/home
// ==/UserScript==

// TODO:
// - The search form gets axed together with the right panel. Move the search to the left panel.

const MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS = 5000;

/*
waitForKeyElements():  A utility function, for Greasemonkey scripts, that detects and handles AJAXed content.

IMPORTANT: This function requires your script to have loaded jQuery.

Usage example:

waitForKeyElements (
    "div.comments"
    , commentCallbackFunction
);

//--- Page-specific function to do what we want when the node is found.
function commentCallbackFunction (jNode) {
    jNode.text ("This comment changed by waitForKeyElements().");
}

Source: https://gist.github.com/BrockA/2625891
*/
function waitForKeyElements(
  selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
  actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
  bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
  iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
) {
  var targetNodes, btargetsFound;

  if (typeof iframeSelector == "undefined")
    targetNodes = $(selectorTxt);
  else
    targetNodes = $(iframeSelector).contents()
      .find(selectorTxt);

  if (targetNodes && targetNodes.length > 0) {
    btargetsFound = true;
    /*--- Found target node(s).  Go through each and act if they
        are new.
    */
    targetNodes.each(function () {
      var jThis = $(this);
      var alreadyFound = jThis.data('alreadyFound') || false;

      if (!alreadyFound) {
        //--- Call the payload function.
        var cancelFound = actionFunction(jThis);
        if (cancelFound)
          btargetsFound = false;
        else
          jThis.data('alreadyFound', true);
      }
    });
  } else {
    btargetsFound = false;
  }

  //--- Get the timer-control variable for this selector.
  var controlObj = waitForKeyElements.controlObj || {};
  var controlKey = selectorTxt.replace(/[^\w]/g, "_");
  var timeControl = controlObj [controlKey];

  //--- Now set or clear the timer as appropriate.
  if (btargetsFound && bWaitOnce && timeControl) {
    //--- The only condition where we need to clear the timer.
    clearInterval(timeControl);
    delete controlObj [controlKey]
  } else {
    //--- Set a timer, if needed.
    if (!timeControl) {
      timeControl = setInterval(function () {
          waitForKeyElements(selectorTxt,
            actionFunction,
            bWaitOnce,
            iframeSelector
          );
        },
        300
      );
      controlObj [controlKey] = timeControl;
    }
  }
  waitForKeyElements.controlObj = controlObj;
}


// Removes sidebar full of spam.
const sidebarLocator = "div[data-testid='sidebarColumn']";
const removeSidebarColumn = () => jQuery(sidebarLocator).remove();
waitForKeyElements(
  sidebarLocator,
  removeSidebarColumn
);

// Widens main feed.
const mainFeedLocator = "div[aria-label='Home timeline']";

function widenMainFeed() {
  console.log('STARTING feed widening');
  const replacements = [];
  const children = jQuery(mainFeedLocator).children();
  cssClassNameMap = {};
  for (i = 0; i < children.length; ++i) {
    jQuery(children[i]).attr("class").split(/\s+/).map((name) => '.' + name).forEach((name) => cssClassNameMap[name] = true);
  }
  const sheets = document.styleSheets;
  for (sheetIx = 0; sheetIx < sheets.length; ++sheetIx) {
    const rules = sheets[sheetIx].cssRules;
    const insertionPoint = rules.length;
    for (ruleIx = 0; ruleIx < rules.length; ++ruleIx) {
      if (cssClassNameMap[rules[ruleIx].selectorText] === true) {
        if (rules[ruleIx].cssText.indexOf('max-width') === -1) continue;
        // look for the css property restricting the width of the feed
        const newText = rules[ruleIx].cssText.replace('max-width: 600px', 'max-width: none');
        // don't apply the replacement here or the page will get stuck loading
        replacements.push([sheetIx, newText]);
      }
    }
  }
  replacements.forEach((r) => {
    console.log('Replacing...');
    console.log(r);
    document.styleSheets[r[0]].insertRule(r[1], document.styleSheets[r[0]].cssRules.length)
  });
  console.log('FINISHED feed widening');
}

waitForKeyElements(
  mainFeedLocator,
  widenMainFeed
);

// Periodically removes 'See more' spam in the main feed.
function removeSeeMoreJunk() {
  jQuery('article').each(function (ix, el) {
    if (jQuery(el).find('span')[4].textContent.trim() === 'See more') {
      jQuery(el).css('display', 'none')
    }
  });
}

setInterval(removeSeeMoreJunk, MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);

// Periodically removes '...follows' junk.
function removeFollowsJunk() {
  jQuery('article').each(function (ix, el) {
    const spanText = jQuery(el).find('span')[0].textContent.trim();
    if (spanText.endsWith('follows') || spanText.endsWith('follow')) {
      jQuery(el).css('display', 'none');
    }
  });
}

setInterval(removeFollowsJunk, MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);