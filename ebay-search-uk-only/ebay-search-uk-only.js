// ==UserScript==
// @name          eBay - Redirects to search results only from UK
// @namespace     https://github.com/johnnybaloney
// @description   By default greedy bay floods search results with items from everywhere in the world. There is no way to change that default setting. The script redirects to page with search results only from UK.
// @include       https://www.ebay.co.uk/sch/*i.html*
// ==/UserScript==

locationUk = 'LH_PrefLoc=1'
escapedStartOfQuery = '\\?'
url = window.location.href
if (url.search(locationUk) === -1) {
    url.search(escapedStartOfQuery) === -1 ? parameterSeparator = '?' : parameterSeparator = '&'
    url = url + parameterSeparator + locationUk
    window.location.replace(url)
}
