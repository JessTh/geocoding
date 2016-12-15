var http        = require('http');
var fs          = require('fs');

var url1        = 'http://maps.googleapis.com/maps/api/geocode/json?address=';
var url2        = '&sensor=false';

var file        = './' + process.argv[2];
var outputFile  = process.argv[3] || './output.txt'

/*
* Arguments: Input file, Output file (optional)
* Read the file, process the adresses, make an API call every 2 seconds and write the output to the output file (default output.txt).
* Input file format: ID, AdressPart1, AddressPart2, .... AddressPartN.
* Output File format:
*   - Success  : ID, Longitude, Latitude, Location Type
*   - Error    : ID, , ,[ZERO_RESULTS]
*/

/* 2 seconds between calls due to API limtation */
fs.readFile(file, function(error, data) {
  if (error) { throw error; }
  var addressList = data.toString().split('\n');
  var i = addressList.length - 1;

  function schedule() {
    i --;
    if (i>0) {
      var rec = addressList[i].split(',');
      var id  = rec[0];
      rec.shift();
      var adr = formatAddress(rec.join(','));
      var url = url1 + adr + url2;
      geocode(id, url);
      setTimeout(schedule, 2000);
    }
  }
  schedule();
});

/* Google Geocode-friendly addresses */
function formatAddress(a) {
  a = a.replace (/[#"&]/g,'');
  a = a.replace(/ /g,'+');
  return a.replace (/Undefined/g,'');
}


function geocode(id, url) {
  http.get(url, function(res) {
    var body    = '';
    var result  = {};
    //console.log('STATUS: ' + res.statusCode);
    res.on('error', function(error) {
      console.log(error);
    });

    res.on('data', function(chunk) {
      body += chunk;
    });

    res.on('end', function() {
      result = JSON.parse(body);
      var newLine = id + ',';

      switch(result.status) {
        case 'ZERO_RESULTS':
          newLine += ',,ZERO_RESULTS\n';
          break;

        case 'OK':
          newLine += result.results[0].geometry.location.lat + ',';
          newLine += result.results[0].geometry.location.lng + ',';
          newLine += result.results[0].geometry.location_type + '\n';
          break;

        default:
          newLine += result.error_message + '\n';
      }
      fs.appendFile(outputFile, newLine);
    });

  });
};
