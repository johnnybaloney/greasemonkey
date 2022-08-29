// ==UserScript==
// @name          Twitter - Junk Remover
// @description   Removes right panel full of junk. Widens the central feed. Removes all sorts of junk from the main feed (check the bottom of this script).
// @namespace     https://github.com/johnnybaloney
// @require       https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// Twitter changes the address to 'https://twitter.com/home' so we have to account for that otherwise the script will
// not start after the first page load, only on reload. Also deal with potential protocol changes and stray whitespace and slashes.
// @include       /^https?://twitter.com.*$/
// ==/UserScript==

// Let Twitter load all its stuff first.
const INITIAL_DELAY_RIGHT_PANEL_MS = 4000;
const INITIAL_DELAY_WIDENING_MS = 4500;
// Interval for checking for junk in the main feed. Reduce to clear junk more frequently.
const MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS = 2500;
// Interval for logging junk removal statistics.
const LOG_STATS_INTERVAL_MS = 10000;

/**
 * waitForKeyElements():  A utility function, for Greasemonkey scripts, that detects and handles AJAXed content.
 *
 * IMPORTANT: This function requires your script to have loaded jQuery.
 *
 * Usage example:
 *
 * waitForKeyElements (
 *     "div.comments"
 *     , commentCallbackFunction
 * );
 *
 * //--- Page-specific function to do what we want when the node is found.
 * function commentCallbackFunction (jNode) {
 *     jNode.text ("This comment changed by waitForKeyElements().");
 * }
 *
 * Source: https://gist.github.com/BrockA/2625891
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

/**
 * Removes (repeatedly) sidebar full of spam.
 */
const removeSidebarColumn = () => {
  const sidebarLocator = "div[data-testid='sidebarColumn']";
  const _removeSidebarColumn = () => {
    jQuery(sidebarLocator).remove();
  }
  waitForKeyElements(
    sidebarLocator,
    setTimeout(_removeSidebarColumn, INITIAL_DELAY_RIGHT_PANEL_MS)
  );
  // keep trying as it will reappear when visiting someone's page
  setInterval(_removeSidebarColumn, MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
}

/**
 * Inserts a replacement search box to the left nav menu.
 * TODO: has to be run last otherwise the junk removal does not work...
 */
const insertSearch = () => {
  const _insertSearch = () => {
    const nav = jQuery('nav');
    const navLeft = jQuery(nav[0]);
    // 'q' is the query parameter
    navLeft.prepend(
      '<div id="searchwrap">' +
      '<form action="https://twitter.com/search">' +
      '<input style="border-radius: 10px; font-size: 14px;" id="search" type="text" name="q" placeholder="Search Twitter"/>' +
      '</form>' +
      '</div>'
    );
  }
  waitForKeyElements(
    'body',
    setTimeout(_insertSearch, INITIAL_DELAY_RIGHT_PANEL_MS)
  );
}

/**
 * Widens main feed.
 * TODO: Does not work on the search page.
 */
const widenMainFeed = () => {
  console.log("Widening main feed...");
  const mainFeedLocator = "div[aria-label='Home timeline']";
  const _widenMainFeed = () => {
    console.log('STARTING feed widening');
    const replacements = [];
    const children = jQuery(mainFeedLocator).children();
    const cssClassNameMap = {};
    for (let i = 0; i < children.length; ++i) {
      jQuery(children[i]).attr("class").split(/\s+/).map((name) => '.' + name).forEach((name) => cssClassNameMap[name] = true);
    }
    // messing with css stylesheets...
    const sheets = document.styleSheets;
    for (let sheetIx = 0; sheetIx < sheets.length; ++sheetIx) {
      const rules = sheets[sheetIx].cssRules;
      const insertionPoint = rules.length;
      for (let ruleIx = 0; ruleIx < insertionPoint; ++ruleIx) {
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
      console.log('Replacing style sheet rule...');
      document.styleSheets[r[0]].insertRule(r[1], document.styleSheets[r[0]].cssRules.length)
    });
    console.log('FINISHED feed widening');
  }

  waitForKeyElements(
    mainFeedLocator,
    setTimeout(_widenMainFeed, INITIAL_DELAY_WIDENING_MS)
  );
}

const hitCounter = {};
/**
 * Stats for the browser console.
 */
const logStats = () => {
  if (Object.keys(hitCounter).length > 0) {
    const summary = Object.keys(hitCounter).sort().map((k) => `- ${k} -> ${hitCounter[k]}\n`).join('');
    const total = Object.values(hitCounter).reduce((prev, cur) => prev + cur, 0);
    console.log(`Junk Removal Stats:\n${summary}\nTotal: ${total}`);
  }
}
/**
 * In case you don't want to count the particular piece of junk
 * that has been hidden.
 */
const SKIP_COUNTER = 'skip counter';
/**
 * Hides the junk infested DOM element.
 *
 * @param el Article (DOM element) to hide.
 * @param type Type of junk, key for the stats object.
 */
const silenceArticle = (el, type) => {
  if (!(el instanceof Element)) {
    console.log(`MONKEY ERROR: invalid element {${el}}`);
    return;
  }
  if (!type) {
    console.log(`MONKEY ERROR: invalid type {${type}}`);
    return;
  }
  const displayCss = jQuery(el).css('display');
  // don't apply again if already applied
  if (displayCss !== 'none') {
    jQuery(el).css('display', 'none');
    if (type !== SKIP_COUNTER) {
      if (!hitCounter[type]) hitCounter[type] = 0;
      ++hitCounter[type];
    }
  }
}
/**
 * Finds spans within the given DOM element and
 * returns the trimmed text of the one at the given index.
 */
const getSpanTextAtIndex = (el, ix) => {
  const spans = jQuery(el).find('span');
  if (ix == null) {
    return spans[spans.length - 1].textContent.trim();
  } else {
    return spans[ix].textContent.trim();
  }
}


const COMPARISON_TYPE_ENDS_WITH = 'comparison type ends with';
const COMPARISON_TYPE_IS = 'comparison type is';
const COMPARISON_TYPE_STARTS_WITH = 'comparison type starts with';
/**
 * Removes an article (a post) which contains a span with a text matching
 * one of the provided offending terms using the given comparison type.
 * @param offendingTermsArr Terms to use when checking the text of a span.
 * @param spanIx The article will contain a number of spans. Which to compare. 'null' if last span.
 * @param comparisonType How to compare the span text.
 * @param type Type for the stats object.
 */
const removeArticleJunkOfType = (offendingTermsArr, spanIx, comparisonType, type) => {
  if (!offendingTermsArr || !(offendingTermsArr instanceof Array)) {
    console.log(`MONKEY ERROR: invalid offending terms {${offendingTermsArr}}.`);
    return;
  }
  if (spanIx === undefined || ((spanIx !== null) && (typeof spanIx) !== "number")) {
    console.log(`MONKEY ERROR: invalid span ix {${spanIx}}.`);
    return;
  }
  if (!comparisonType || ![COMPARISON_TYPE_ENDS_WITH, COMPARISON_TYPE_IS, COMPARISON_TYPE_STARTS_WITH].find((type) => type === comparisonType)) {
    console.log(`MONKEY ERROR: invalid comparison type {${comparisonType}}`);
    return;
  }
  if (!type) {
    console.log(`MONKEY ERROR: invalid type {${type}}`);
    return;
  }
  jQuery('article').each(function (ix, el) {
    const spanText = getSpanTextAtIndex(el, spanIx);
    switch (comparisonType) {
      case COMPARISON_TYPE_IS:
        if (offendingTermsArr.find((term) => spanText === term)) {
          silenceArticle(el, type);
        }
        break;
      case COMPARISON_TYPE_STARTS_WITH:
        if (offendingTermsArr.find((term) => spanText.startsWith(term))) {
          silenceArticle(el, type);
        }
        break;
      case COMPARISON_TYPE_ENDS_WITH:
        if (offendingTermsArr.find((term) => spanText.endsWith(term))) {
          silenceArticle(el, type);
        }
        break;
    }
  });
}

/**
 * Periodically removes 'Promoted Tweet' junk.
 */
function removePromotedTweetJunk() {
  const offendingTerm = 'Promoted Tweet';
  const cellIneerDivLocator = 'div[data-testid="cellInnerDiv"]';
  jQuery(cellIneerDivLocator).each(function (ix, el) {
    // the locator isn't precise, the element can be anything, so have to check all spans
    const spans = jQuery(el).find('span');
    for (let i = 0; i < spans.length; i++) {
      if (spans[i].textContent.trim() === offendingTerm) {
        silenceArticle(el, 'promoted');
        break;
      }
    }
  });
}

/**
 * For junk that comes in the form of a bunch of sibling 'article' div's.
 *
 * @param startTerm The exact span text in the first div in the group. Case sensitive.
 * @param endTerm The exact span text in the last div in the group. Case sensitive.
 * @param statsKey What key to increase in the stats object.
 */
function removeSiblings(startTerm, endTerm, statsKey) {
  if (!startTerm || !endTerm || !statsKey) {
    console.log(`MONKEY ERROR: invalid argument to remove siblings function.`);
    return;
  }
  const cellInnerDivLocator = 'div[data-testid="cellInnerDiv"]';
  const innerDivs = jQuery(cellInnerDivLocator);
  let foundFirst = false;
  for (let innerDivIx = 0; innerDivIx < innerDivs.length; innerDivIx++) {
    const spansForDiv = jQuery(innerDivs[innerDivIx]).find('span');
    for (let j = 0; j < spansForDiv.length; j++) {
      const spanText = spansForDiv[j].textContent.trim();
      if (spanText === startTerm) {
        // first one of the bunch
        silenceArticle(innerDivs[innerDivIx], SKIP_COUNTER);
        foundFirst = true;
        break;
      } else if (spanText === endTerm) {
        // last one of the bunch
        silenceArticle(innerDivs[innerDivIx], statsKey);
        // this group of siblings is finished, carry on looking for another bunch of junk in this lot
        foundFirst = false;
        break;
      } else if (foundFirst) {
        // the ones in between
        silenceArticle(innerDivs[innerDivIx], SKIP_COUNTER);
        break;
      }
    }
  }
}

removeSidebarColumn();
widenMainFeed();
// You must see more, MORE! Never ever leave Twitter, stay hooked...
setInterval(() => removeArticleJunkOfType(['See more'], 4, COMPARISON_TYPE_IS, 'see more'),
  MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
// Who cares who other people follow.
setInterval(() => removeArticleJunkOfType(['follows', 'follow'], 0, COMPARISON_TYPE_ENDS_WITH, 'follows'),
  MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
// There are some compulsive users out there who just keep reposting every piece of rubbish they see.
setInterval(() => removeArticleJunkOfType(['Retweeted'], 0, COMPARISON_TYPE_ENDS_WITH, 'retweeted'),
  MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
// It is safer for your sanity if you don't know what people you follow (and probably people they follow etc.) like.
setInterval(() => removeArticleJunkOfType(['liked'], 0, COMPARISON_TYPE_ENDS_WITH, 'liked'),
  MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
// Twitter says 'We listened!' and swaps one kind of rubbish for another.
setInterval(() => removeArticleJunkOfType(['Based on your feedback'], 0, COMPARISON_TYPE_IS, 'feedback'),
  MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
// Stealth promo is a kind of junk that pretends to be a legit tweet but is in fact an ad. There is a tiny 'Promoted' text at the bottom of the 'tweet'.
setInterval(() => removeArticleJunkOfType(['Promoted'], null, COMPARISON_TYPE_STARTS_WITH, 'stealth promo'),
  MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
// This is regular promo that doesn't pretend to be anything else. It has 'Promoted Tweet' heading.
setInterval(removePromotedTweetJunk,
  MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
// A list of random people Twitter says you should follow.
setInterval(() => removeSiblings('Who to follow', 'Show more', 'who to follow'),
  MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
// More people, phrased differently.
setInterval(() => removeSiblings('People', 'View all', 'who to follow'),
  MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
// A list of random topics Twitter says you should follow.
setInterval(() => removeSiblings('Topics to follow', 'More Topics', 'topics to follow'),
  MAIN_FEED_JUNK_REMOVAL_INTERVAL_MS);
setInterval(logStats, LOG_STATS_INTERVAL_MS);
insertSearch();