
const request = require('request');
var bodyparser=require('body-parser');


request({
  url: 'https://api.foursquare.com/v2/venues/559ed190498eed15c47910d8/photos',
  method: 'GET',
  qs: {
    client_id: 'NAGACSAFQSQIWKU535EUNQSJUBO5DW01VVST0C312AV04GAZ',
    client_secret: 'VP0SWQZWDWAHGSGHBOIVK3W4GAPIE1MTYXVGT2REZWOBZW3V',
    group: 'venue',
    VENUE_ID:"559ed190498eed15c47910d8",
    offset: 100,
    limit: 1,
    v:"20171031"
  }
}, function(err, res, body) {
  if (err) {
    console.error(err);
  } else {
    console.log(body);
  }
});


