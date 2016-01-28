// This function is what kicks off the datasync. It will either loop through and send 100 records at a time, 
// or send the entire dataset,depending on the size of the document

function push(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var tablename = normalizeHeaders([sheet.getSheetName()])[0];
  if (ScriptProperties.getProperty('RJMETRICSKEY') == null || ScriptProperties.getProperty('RJMETRICSCID') == null || ScriptProperties.getProperty(tablename) == null){
    Browser.msgBox("You are missing some of the required information to send the data. Please click add the required information in the next prompt");
    onInstall();
  }
  else {
    var range = sheet.getDataRange();
    var lastcolumn = range.getLastColumn();
    Logger.log(tablename);
    var newkey = normalizeHeaders(ScriptProperties.getProperty(tablename).split(','));
    var firstrow = 2
    // last row minus 1 assuming the first row is headers
    var lastrow = range.getLastRow() + 1;
    trackdoc(lastrow, tablename);
    
    var i = 101;
    if (ScriptProperties.getProperty('RJMETRICSKEY') == null || ScriptProperties.getProperty('RJMETRICSCID') == null || tablename == null){
      msgBox("You are missing some of the required information to send the data. Please click the 'Setup Spreadsheet For Push' in the dropdown");
    }
    else if (lastrow > i){
      largedoc(lastrow, lastcolumn, i, tablename, sheet, newkey)
      
    }
    else {smalldoc(lastrow, lastcolumn, i, firstrow, tablename, sheet, newkey)};
  }
}

function insertKeys(spreadsheetdata, keys){
 var new_array = []
 var arrayLength = spreadsheetdata.length;
  for (var i = 0; i < arrayLength; i++) {
    //Logger.log('keys' + keys);
    var record = spreadsheetdata[i];
    record['keys'] = keys;
    new_array.push(record);
    //Logger.log(record);
  }
  
  return new_array
}

function largedoc(lastrow, lastcolumn, i, tablename, sheet, newkey){
  Logger.log('starting largedoc rows loop');
  // this first row setting is so the first row gets incremented by 100 at the beginning of the while loop instead of the end.
  var firstrow = -98;
  // send 100 rows at a time, asyncronosly. 
  while (lastrow > i){
    firstrow = firstrow + 100
    //Logger.log('rows ' + firstrow + " - " + (firstrow + 100));
    var datarange = sheet.getRange(firstrow, 1, 100, lastcolumn);
    //Logger.log("datarange = " + datarange.getNumRows())
    var spreadsheetdata = getRowsData(sheet, datarange, 1);
    var payload_pre = insertKeys(spreadsheetdata, newkey);
    var payload = JSON.stringify(payload_pre);
    //Logger.log("Payload Length" + spreadsheetdata.length)
    //Logger.clear();
    var api = ScriptProperties.getProperty('RJMETRICSKEY');
    var cid = ScriptProperties.getProperty('RJMETRICSCID');
    var url = 'https://connect.rjmetrics.com/v2/client/' + cid + '/table/' + tablename + '/data?apikey=' + api;
    var options = {
      'method': 'post',
      "contentType" : "application/json",
      "payload": payload
    };
    var response = UrlFetchApp.fetch(url, options);
    i = i + 100;
    // Uncomment if the import api is having issues is giving 504s or other connection errors.This make the script take a while to complete however.
    // Utilities.sleep(10000);
  }
  firstrow = firstrow + 100
  smalldoc(lastrow, lastcolumn, i, firstrow, tablename, sheet, newkey)
}

// For sending the entire document, if less than 100 rows, or for sending the remainder of a large document after the loop of 100 records at a time.
function smalldoc(lastrow, lastcolumn, i, firstrow, tablename, sheet, newkey){
  Logger.log('starting last rows');
  //Logger.log('rows ' + firstrow + " - " + lastrow);
  var length_left = lastrow - firstrow
  var datarange = sheet.getRange(firstrow, 1, length_left, lastcolumn);
  var spreadsheetdata = getRowsData(sheet, datarange, 1);
  var payload_pre = insertKeys(spreadsheetdata, newkey);
  //Logger.log("Payload Length" + spreadsheetdata.length);
  var payload = JSON.stringify(payload_pre);
  //Logger.clear();
  Logger.log(payload_pre.length);
  var api = ScriptProperties.getProperty('RJMETRICSKEY');
  var cid = ScriptProperties.getProperty('RJMETRICSCID');
  var url = 'https://connect.rjmetrics.com/v2/client/' + cid + '/table/' + tablename + '/data?apikey=' + api;
  var options = {
    'method': 'post',
    "contentType" : "application/json",
    "payload": payload
  };
  var response = UrlFetchApp.fetch(url, options);
  Logger.log(response);
  return response
}


function trackdoc(lastrow, tablename) {
 var remote = SpreadsheetApp.openById('1f33oopWLMFGtuWQlLpUrpyeScMXnRd9cGSQxKuZ51B0');
 var remote_sheet = remote.getSheets()[0];
 var cid = ScriptProperties.getProperty('RJMETRICSCID');
 var date = new Date();
 // Appends a new row with 3 columns to the bottom of the
 // spreadsheet containing the values in the array
 remote_sheet.appendRow([cid, lastrow, tablename, date ]); 
}

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

function onOpen() {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    {name: 'Sync with RJMetrics', functionName: 'push'},
    {name: 'Setup Spreadsheet For Push', functionName: 'onInstall'}
  ];
  spreadsheet.addMenu('RJMetrics Import', menuItems);
  function auth() {}
  auth()
}

// getRowsData iterates row by row in the input range and returns an array of objects.
// Each object contains all the data for a given row, indexed by its normalized column name.
// Arguments:
//   - sheet: the sheet object that contains the data to be processed
//   - range: the exact range of cells where the data is stored
//   - columnHeadersRowIndex: specifies the row number where the column names are stored.
//       This argument is optional and it defaults to the row immediately above range; 
// Returns an Array of objects.
function getRowsData(sheet, range, columnHeadersRowIndex) {
  columnHeadersRowIndex = columnHeadersRowIndex || range.getRowIndex() - 1;
  var numColumns = range.getLastColumn() - range.getColumn() + 1;
  var headersRange = sheet.getRange(columnHeadersRowIndex, range.getColumn(), 1, numColumns);
  var headers = headersRange.getValues()[0];
  return getObjects(range.getValues(), normalizeHeaders(headers));
}

// For every row of data in data, generates an object that contains the data. Names of
// object fields are defined in keys.
// Arguments:
//   - data: JavaScript 2d array
//   - keys: Array of Strings that define the property names for the objects to create
function getObjects(data, keys) {
  var objects = [];
  for (var i = 0; i < data.length; ++i) {
    var object = {};
    var hasData = false;
    for (var j = 0; j < data[i].length; ++j) {
      var cellData = data[i][j];
      if (isCellEmpty(cellData)) {
        object[keys[j]] = null
      }
      object[keys[j]] = cellData;
      hasData = true;
    }
    if (hasData) {
      objects.push(object);
    }
  }
  return objects;
}

// Returns an Array of normalized Strings.
// Arguments:
//   - headers: Array of Strings to normalize
function normalizeHeaders(headers) {
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    var key = normalizeHeader(headers[i]);
    if (key.length > 0) {
      keys.push(key);
    }
  }
  return keys;
}

// Normalizes a string, by removing all non-alphanumeric characters and using mixed case
// to separate words. The output will always start with a lower case letter.
// This function is designed to produce JavaScript object property names.
// Arguments:
//   - header: string to normalize
// Examples:
//   "First Name" -> "firstName"
//   "Market Cap (millions) -> "marketCapMillions
//   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
function normalizeHeader(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; ++i) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    if (!isAlnum(letter)){
      continue;
    }
    if (key.length == 0 && isDigit(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}

// Returns true if the cell where cellData was read from is empty.
// Arguments:
//   - cellData: string
function isCellEmpty(cellData) {
  return typeof(cellData) == "string" && cellData == "";
}

// Returns true if the character char is alphabetical, false otherwise.
function isAlnum(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
      char == '_' ||
        isDigit(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit(char) {
  return char >= '0' && char <= '9';
}
