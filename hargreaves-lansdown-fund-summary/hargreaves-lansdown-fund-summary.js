// ==UserScript==
// @name          Hargreaves Lansdown - Summary of performance and fees of a fund in a simple table
// @namespace     https://github.com/johnnybaloney
// @description   Shows the info in a simple table instead of having it scattered all over the page.
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @include       /^https://www.hl.co.uk/funds/fund-discounts,-prices--and--factsheets/search-results/[a-z]/[^/]*$/
// ==/UserScript==
let factsheetTable = Object.values($('.factsheet-table'))
let charges1 = factsheetTable[0]
let charges2 = factsheetTable[1]
let performance = factsheetTable[4]
let performanceArr = []
$(performance).find('td.align-center').each(function (k, v) {
    let percent = $(v).text().trim()
    if (parseFloat(percent) < 0) {
        performanceArr.push('<span style="color: red; font-weight: bold">' + percent + '</span>')
    } else {
        performanceArr.push('<span style="color: green; font-weight: bold">' + percent + '</span>')
    }
})
let charges1Arr = []
$(charges1).find('td').each(function (k, v) {
    s = $(v).text().trim()
    if (s) {
        charges1Arr.push(s)
    }
})
let charges2Arr = []
let spacesRegex = '/\\s\\s+/g'
let singleSpace = ' '
Object.values($(charges2).find('td')).slice(0, 4).forEach(function (td) {
    charges2Arr.push($(td).text().trim().replace(spacesRegex, singleSpace))
})
let rowValues = [].concat(performanceArr).concat(charges2Arr).concat(charges1Arr)
let headers = ['2016/2017', '2017/2018', '2018/2019', '2019/2020', '2020/2021', 'Performance fee', 'Ongoing charge (OCF/TER)', 'Ongoing saving from HL', 'Net ongoing charge', 'Initial charge', 'Initial saving from HL', 'HL dealing charge', 'Net initial charge']
$('<table id="myTable"><tr id="myHeaderRow" class="header-row"></tr><tr id="myRow"></tr></table>').insertAfter('#security-title');
let myTable = $('#myTable')
let myHeaderRow = myTable.find('#myHeaderRow')
let myRow = myTable.find('#myRow')
let dottedCellBorder = '"border-style: solid; border-width: 0.1px; border-color: #efefef"'
headers.forEach(function (header) {
    myHeaderRow.append('<th style=' + dottedCellBorder + '>' + header + '</th>')
})
rowValues.forEach(function (value) {
    myRow.append('<td style=' + dottedCellBorder + '>' + value + '</td>')
})
myTable.css('border', 'thick solid').css('color', '#1e1e55').css('margin-bottom', '1em')