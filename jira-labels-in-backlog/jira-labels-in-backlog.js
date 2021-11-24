// ==UserScript==
// @name        Jira - Labels in Backlog
// @description Displays labels under ticket summary in the backlog view. Update the @include's in the header and the URL strings in variables below. A bit rough and temperamental but should work on the first page refresh ;) Used with Jira Cloud 2021/11.
// @namespace   https://github.com/johnnybaloney
// @include     https://<UPDATE_ME>/secure/RapidBoard.jspa?rapidView=54&projectKey=V3&view=planning*
// @include     https://<UPDATE_ME>/jira/software/c/projects/V3/boards/54/backlog*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/aui/9.3.0/aui/aui-prototyping.js
// @version     1
// ==/UserScript==

giraRest = "https://<UPDATE_ME>/rest/gira/1/"
labelLinkUrl = "https://<UPDATE_ME>/issues/?jql=labels"

async function main() {
  // get the keys from page and map them to their labels

  iDivs = $(".js-issue");
  iCount = $(".js-issue").length;
  iRows = [];
  for (i = 0; i < iCount; i++) {
    iRows.push(iDivs[i]);
  }
  keysString = iRows.map((row) => $(row).find("a.ghx-key").text()).join(",");

  query =
    '{"query":"query issueViewBulkQuery($jql: String!, $limit: Int!) {bentoViewIssues_all: viewIssues(jql: $jql, first: $limit) {nodes {fields {__typename ... on IssueKeyField {stringValue}... on LabelsField {labels}}}}}","variables":{"jql":"issuekey in (' +
    keysString +
    ')","limit":' +
    iCount +
    "}}";

  updateKeyToLabelsMap = function (map, ticketNode) {
    fields = ticketNode.fields;
    fields.forEach(function (field) {
      if (field.__typename == "IssueKeyField") {
        key = field.stringValue;
      } else {
        labels = field.labels;
      }
    });
    map[key] = labels;
  };

  keyToLabels = {};

  $.ajax({
    type: "POST",
    url: giraRest,
    contentType: "application/json;charset=UTF-8",
    data: query,
    dataType: "json",
  }).done(function (res) {
    nodes = res.data.bentoViewIssues_all.nodes;
    nodes.forEach((node) => updateKeyToLabelsMap(keyToLabels, node));

    // prepare label divs

    keyToLabelDiv = {};

    for (const [key, labels] of Object.entries(keyToLabels)) {
      if (labels.length == 0) continue;
      labelDiv = "";
      labels.forEach(function (label) {
        labelDiv +=
          '<span style="background-color: rgb(244, 245, 247);margin: 4px; padding: 4px;color: rgb(0, 101, 255);">' +
          '<a href=' + labelLinkUrl + '%20%3D%20%22'+ label + '%22" target="_blank">' +
          label +
          '</a>' +
          "</span>";
      });
      labelDiv = '<div style="margin-left: 3em;">' + labelDiv + "</div>";
      keyToLabelDiv[key] = labelDiv;
    }

    // apply the label divs

    keyToRow = {};
    iRows.forEach((row) => (keyToRow[$(row).find("a.ghx-key").text()] = row));

    for (const [key, div] of Object.entries(keyToLabelDiv)) {
      $(keyToRow[key]).append(div);
    }
  });
}

AJS.toInit(function () {
  main();
});
