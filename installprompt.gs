function onInstall() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var key = Browser.inputBox("Input RJMetrics API Key here. Press cancel if no change.", Browser.Buttons.OK_CANCEL);
  var cid = Browser.inputBox("Input RJMetrics Client Id here. Press cancel if no change.", Browser.Buttons.OK_CANCEL);
  var primaryKey = Browser.inputBox("Enter a comma separated list of the primary key(s) for this Sheet (tab). Usually this will be one column, but if multiple columns make a row unique, add more. Press cancel if no change.", Browser.Buttons.OK_CANCEL);
  if(key && key!="cancel") ScriptProperties.setProperty("RJMETRICSKEY", key);
  if(cid && cid!="cancel") ScriptProperties.setProperty("RJMETRICSCID", cid);
  if(primaryKey && primaryKey!="cancel") ScriptProperties.setProperty(normalizeHeaders([sheet.getSheetName()]), primaryKey);
  auth()
}

function auth() {}
