/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/
var aviationJson = require("aviation-json");
var airports = aviationJson.airports;
var cityAirports = aviationJson.city_airports;
var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var foursquare = (require('foursquarevenues'))('NAGACSAFQSQIWKU535EUNQSJUBO5DW01VVST0C312AV04GAZ', 'VP0SWQZWDWAHGSGHBOIVK3W4GAPIE1MTYXVGT2REZWOBZW3V');
const request = require('request');
var async = require('async');
const fetchAirportData = require('fetch-airport-data')
const { WitRecognizer } = require('botbuilder-wit-remade');
var random = require('random-number-generator');
var Wit = require('node-wit').Wit;
var what_type = "";
var language="";
var quickReplies = require('botbuilder-quickreplies');
var client = new Wit({
    accessToken: '4RZ3GZTLM6KIITPFMROKAXZYJNQLI2JV'
});
var facebookEvents='';
var latt='';
var long='';
var EventSearch = require("facebook-events-by-location-core");
var es = new EventSearch();
var wrong_location=false;
var geocoding = new require('reverse-geocoding-google');
var changeLocationMsg=false;
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
var googleVenues=[];
var frAir='';
var tAir='';
var frDate='';
var tDate='';
var wrongFromAirport=false;
var flightStep=0;
var wrongToAirport=false;
var falseDates=false;
var a='';
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});
const accessToken='EAACRcRQcZABYBALLsXvu9wRGDnnhsS2r9ranl7DdkY2g41DSEVlafyFDZBzu0D1nxeaTmlYlbiqer6pjiOwB5yMYIrinsUMzGzgPeMofGVxJ9Kpw0CNWi5gvCAaVUmrbVkRCbwoZB4weDZBldN2tpeczB0mKxW6oDo1BWj1pSQZDZD';
// const { MessengerClient } = require('messaging-api-messenger');
// const clientas = MessengerClient.connect(accessToken);

//clientas.setGetStarted('GET_STARTED');
/*
clientas.setPersistentMenu([
  {
    locale: 'default',
    call_to_actions: [
      {
        title: 'Start Over',
        type: 'postback',
        payload: 'RESTART',
      },
        {
        title: 'Help',
        type: 'postback',
        payload: 'HELP',
      }
     
    ],
  },
]);
*/




// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
//var bot = new builder.UniversalBot(connector);
//bot.set('storage', tableStorage);

var bot = new builder.UniversalBot(connector, [

    //Step 1- Read from entity Language 



]);

//bot.set('persistConversationData', false);
bot.recognizer(new WitRecognizer('4RZ3GZTLM6KIITPFMROKAXZYJNQLI2JV'));
bot.use(quickReplies.QuickRepliesMiddleware);
quickReplies.LocationPrompt.create(bot);
// bot.set('persistConversationData', false);
// bot.set('persistUserData', false);
//Intro
bot.dialog('Intro', [
    //Step 1- Welcome the user
    function (session) {
             session.sendTyping();
        var answers = {
            1: "Χαίρετε!Τι μπορώ να κάνω για εσάς?",
            2: "Γειά σας!Πείτε μου τι θέλετε να κάνω για εσάς",
            3: "Χαίρομαι που είστε εδω!Τι θέλετε να βρω για σας?",
            4:"Καλώς Ήρθατε!Πως μπορώ να βοηθήσω?"
        }
        var rand = random(4, 1);
        console.log(session.userData.lingua);
        session.sendTyping();
        builder.Prompts.text(session, session.userData.lingua == 'greek' ? answers[rand]: 'Hey there!How can i help you?');
    },
    //Step 2- Begin Greek_Core
    function (session) {
        session.beginDialog('Core');
    }]);
bot.dialog('Hello', [

    function (session, results) {

        //Check if it is greek, then begin Greek_Intro

        session.userData.lingua = "greek";
        session.beginDialog('Intro');

        //Else begin English_Intro


    },
    //Step 2- End of dialog
    function (session, results) {
        session.endDialog();
    }

]).triggerAction({
    matches: 'Language.ellhnasego'
});

bot.dialog('Eng_Hello', [

    function (session, results) {
        //Check if it is greek, then begin Greek_Intro
        session.userData.lingua = "english";
        session.beginDialog('Intro');
    },
    //Step 2- End of dialog
    function (session, results) {
        session.endDialog();
    }
]).triggerAction({
    matches: 'Language.agglouego'
});
//Core - The basic menu
bot.dialog('Core', [
    //Step 1- Regarding the input, a new dialog begins
    function (session, results, next) {
        client.message(session.message.text, {}).then((data) => {
             var wit_value="";
            if(data.entities.Category_Type!=undefined){
                wit_value = data.entities.Category_Type[0].value;
            }
            else{
                wit_value="empty";
            }       
            console.log(JSON.stringify(wit_value));
            if (wit_value == 'food') {
                session.beginDialog('Food');
            }
            else if (wit_value == 'hotels') {
                session.beginDialog('Hotels');
            }
            else if (wit_value == 'transports') {
                session.beginDialog('Transports');
            }
            else if (wit_value == 'drink') {
                session.beginDialog('Drinks');

            }
            else if (wit_value == 'hospitals') {
                session.beginDialog('Hospitals')
            }
            else if(wit_value=='empty') {
                session.send(session.userData.lingua == 'greek' ? 'Με συγχωρείς, δεν κατάλαβα το αίτημα σου' : 'Sorry i did not understand you');
            }
        })
    },
    //Step 2- End of dialog
    function (session, results) {
        session.endDialog();
    }
]);

//Food
bot.dialog('Food', [
    //Step 1- User input for which category of food
    function (session) {
        session.sendTyping();
        builder.Prompts.text(session, session.userData.lingua == 'greek' ? "Τι τραβά η όρεξη σου? Πίτσα,σουβλάκι,μεξικάνικο,burger..? Μη μου πεις sushi :P" : 'Would you like pizza,sushi,mexican or burger?');
    },
    //Step 2- Find the category with wit.ai
    function (session, results) {
        client.message(results.response, {}).then((data) => {
            var wit_value = JSON.stringify(data.entities.Food_Type[0].value);
            what_type = wit_value;
        });
        session.sendTyping();
        builder.Prompts.text(session, session.userData.lingua == 'greek' ? "Εισαγωγή τοποθεσίας" : 'Enter location');
    },
    //Step 3- Find the venues via Foursquare
    function (session, results) {
        session.sendTyping();
        findPlaces(session, results);
    },
    //Step 4- Begin the basic dialog
    function (session, results) {
        session.beginDialog('Intro');
    }
]).triggerAction({
    matches: 'CategoryType.food'
});


createDialog('mexican','FoodType.Mexicanboy','foursquare');
createDialog('creperie','FoodType.Crepery!','foursquare');
createDialog('sushi','FoodType.SushiReFile','foursquare');
createDialog('pizza','FoodType.Pizzoup','foursquare');
createDialog('burger','FoodType.Bourgou','foursquare');
createDialog('souvlaki','FoodType.SouvlakoBoy','foursquare');
createDialog('beer','DrinkType.Beeraki','foursquare');
createDialog('coffee','DrinkType.Coffeez','foursquare');
createDialog('cocktail','DrinkType.Coctailium','foursquare');
createDialog('wine','DrinkType.Wineiou','foursquare');
createDialog('hospitals','ServicesType.Hospitals!','foursquare');
createDialog('hotel','ServicesType.Hotels!','foursquare');
createDialog('shopping','ServicesType.shoposhopo','foursquare');
createDialog('museums','ServicesType.museouma','foursquare');
createDialog('theater','ServicesType.theatrothe','foursquare');
createDialog('Historic Site','ServicesType.historicosito','foursquare');
createDialog('pharmacy','ServicesType.Pharmakeioure!','google');



//Drinks
bot.dialog('Drinks', [
    //Step 1- User input for which category of drink
    function (session) {
        session.sendTyping();
        builder.Prompts.text(session, session.userData.lingua == 'greek' ? "Τι θέλεις να πιείς?Κοκτέιλ,Μπιρίτσα,Κρασάκι.." : 'Would you like to drink beer,cocktail or wine?');
    },
    //Step 2- Find the category with wit.ai
    function (session, results) {
        client.message(results.response, {}).then((data) => {
            var wit_value = JSON.stringify(data.entities.Drink_Type[0].value)
            what_type = wit_value;
        });
        session.sendTyping();
        builder.Prompts.text(session, session.userData.lingua == 'greek' ? "Εισαγωγή τοποθεσίας" : 'Enter location');
    },
    //Step 3- Find the venues via Foursquare
    function (session, results) {
        session.sendTyping();
        findPlaces(session, results);
    },
    //Step 4- Begin the basic dialog
    function (session) {
        session.beginDialog('Core');
    }
]).triggerAction({
    matches: 'CategoryType.drink'
});




//Help
bot.dialog('Help', [

    function (session) {
        session.sendTyping();
        builder.Prompts.text(session, "Μπορείς να μου πεις τι θες να φας, τι θες να πιείς,να δεις ξενοδοχεία, πτήσεις, νοσοκομεία.Γράψε για παράδειγμα θέλω μπέργκερ");

    },
    function (session) {
        session.beginDialog('Intro');
    }
]).triggerAction({
    matches: 'Help.help'
});

bot.dialog('Hotels',[
    
]).triggerAction({
    matches: 'Help.help'
});

bot.dialog('YourWelcome', [

    function (session, resutls, next) {
        var answers = {
            1: "Παρακαλώ!",
            2: "Δεν κάνει τίποτα...",
            3: "Να είσαι καλά!!"
        }
        var rand = random(3, 1);
        session.sendTyping();
        session.send(answers[rand]);
        next();
    },
    function (session) {
       session.endConversation();

    }
]).triggerAction({
    matches: 'Thanks.welcome'
});
 bot.dialog('Change', [

    function (session, results, next) {
        if (session.userData.lingua == 'greek') {
            session.userData.lingua = 'english';
        }
        else if (session.userData.lingua == 'english') {
            session.userData.lingua = 'greek';
        }
        next();
    },
    function (session) {
        session.beginDialog('Intro');
    }
]).triggerAction({
    matches: 'Language.changetheblah'
});

bot.dialog('Flights', [

    function (session,results,next) {
        if(flightStep==2||flightStep==3){
            next();
        }
        else{
        if(wrongFromAirport==true){
            builder.Prompts.text(session, ' Δεν βρέθηκε!Επιλέξτε ξανά σωστό αεροδρόμιο αναχώρησης');
        }
        else{
            builder.Prompts.text(session, ' Επιλέξτε αεροδρόμιο αναχώρησης');
            
        }
    }
        
    },
    function (session, results,next) {
        if(flightStep==2||flightStep==3){
            next();
        }
        else{
        frAir = results.response;

        if (airportCityExists(frAir) == false) {
            wrongFromAirport=true;
            session.beginDialog('Flights');
        }
        else {
            wrongFromAirport=false;
            next();
            
        }
    }
    },
    function(session,results,next){
        if(flightStep==3){
            next();
        }
        else{
        if(wrongToAirport==true){
            builder.Prompts.text(session, ' Δεν βρέθηκε!Επιλέξτε ξανά σωστό αεροδρόμιο άφιξης');
        }
        else{
            builder.Prompts.text(session, ' Επιλέξτε αεροδρόμιο άφιξης');
            
        }
        }
    },
    function (session, results,next) {
        if(flightStep==3){
            next();
        }
        else{
        tAir = results.response;
        if(airportCityExists(tAir)==false){
            wrongToAirport=true;
            flightStep=2;
            session.beginDialog('Flights');
        }
        else{
            wrongToAirport=false;
            flightStep=3;
            next();
        }
        }

    },function(session,results,next){
        if(falseDates==true){
             builder.Prompts.text(session, 'Λανθασμένες ημερομηνίες!Επιλέξτε ξανά ημερομηνία αναχώρησης M-D(π.χ 2018-04-15)');
        }
        else{
             builder.Prompts.text(session, ' Επιλέξτε ημερομηνία αναχώρησης M-D(π.χ 2018-04-15)');
        }
        
    },
   
    function (session, results) {
        frDate = results.response;
        builder.Prompts.text(session, ' Επιλέξτε ημερομηνία αποχώρησης  Y-M-D(π.χ 2018-04-20)');
    },
    function (session, results, next) {
        tDate = results.response;
        if(checkFlightDates(frDate,tDate)==true){
            falseDates=false;
            next();
        }
        else{
           falseDates=true;
           session.beginDialog('Flights');
        }
        

    },
    function (session, results) {
        flightStep=0;
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .title('Υπαρκτές πτήσεις')
                .buttons([builder.CardAction.openUrl(session, kayakUrl(frAir, tAir, frDate, tDate), 'Δες τις πτήσεις')])
        ]);
        builder.Prompts.text(session, msg);
    },
    function(session){
       
        session.endConversation();
    }

]).triggerAction({
    matches: 'ServicesType.flightou'
});
function checkFlightDates(fd,td){
    if(afterNow(fd)==true&&validateDates(fd,td)==true){
        return true;
    }
    else{
        return false;
    }

}

function getCurrentDay(){
    var d = new Date();
    var n ="";
    if(d<10){
         n="0"+d.getDate();
    }
    else n=d.getDate()
   
    return n;
}
function getCurrentMonth(){
    var d = new Date();
    var month = [];
    month[0] = "01";
    month[1] = "02";
    month[2] = "03";
    month[3] = "04";
    month[4] = "05";
    month[5] = "06";
    month[6] = "07";
    month[7] = "08";
    month[8] = "09";
    month[9] = "10";
    month[10] = "11";
    month[11] = "12";
    var n =month[d.getMonth()];
    return n;
}
function getCurrentYear(){
    var d=new Date();
    var n=""+d.getFullYear()+"";
    return n;
}



function afterNow(fd){
    var pFd=fd.split("-");
    var pureFdYear=pFd[0];
    var pureFdMonth=pFd[1];
    var pureFdDay=pFd[2];
  

    if(pureFdYear<getCurrentYear()){
        return false;
    }
    else if(pureFdYear>getCurrentYear()){
        return true;
    }
    else if(pureFdYear==getCurrentYear()){
        if(pureFdMonth<getCurrentMonth()){
            return false;
        }
        else if(pureFdMonth>getCurrentMonth()){
            return true;
        }
        else if(pureFdMonth==getCurrentMonth()){
            if(pureFdDay<getCurrentDay()){
                return false;
            }
            else{
                return true;
            }
        }
    }
    return false;


 }

function validateDates(fd,td){

    var pFd=fd.split("-");
    var pTd=td.split("-");
    var pureFdYear=pFd[0];
    var pureFdMonth=pFd[1];
    var pureFdDay=pFd[2];
    var pureTdYear=pTd[0];
    var pureTdMonth=pTd[1];
    var pureTdDay=pTd[2];

  if(pureTdYear<pureFdYear){
      return false;
  }
  else if(pureTdYear==pureFdYear){
      if(pureTdMonth>pureFdMonth){
          return true;
      }
      else if(pureTdMonth<pureFdMonth){
          return false;
      }
      else if(pureTdMonth==pureFdMonth){
          if(pureTdDay<pureFdDay){
              return false;
          }
          else{
              return true;
          }
      }
  }
  else if(pureTdYear>pureFdYear){
      return true;
  }
  return false;
}
function airportCityExists(ap) {
    if(cityAirports[ap]!=undefined){
        return true;
    }
  return false;
}

function findAirportCode(city){
    var aerodromio=cityAirports[city][0];
    return airports[aerodromio].iata;
}



function kayakUrl(fromCity,toCity,fromDate,toDate){
    var fromAirport=findAirportCode(fromCity);
    var toAirport=findAirportCode(toCity);
    var kayakUrl='https://www.gr.kayak.com/flights/'+fromAirport+'-'+toAirport+'/'+fromDate+'/'+toDate+'?sort=bestflight_a';
    return kayakUrl;
}




bot.dialog('showGoogle',[
    function(session){
        var msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel);
                msg.attachments([
                    new builder.HeroCard(session)
                    .title('')
                     .subtitle('')
                ]);
                console.log("dadsadasdasda");
           
      builder.Prompts.text(session, msg);
    },function(session){
        session.endConveration();
    }
])
bot.dialog('Events', [  
    function(session,results){
        session.sendTyping();
        quickReplies.LocationPrompt.beginDialog(session);
       
    },
    function(session,results){
        session.sendTyping();
        
    var location = results.response.entity;
    latt=location.coordinates.lat;
    long=location.coordinates.long;
    var config = {
                'latitude': latt,
                'longitude': long,
                'key': 'AIzaSyAlSRr4hhyH1TptRNZckM0bpM1oK-vGjyk'
            };
    geocoding.location(config, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            builder.Prompts.text(session,'Διάλεξε απόσταση απο 1-2500(μέτρα)');
        }
    });
        
    },
    function(session,results,next){
        var name='';
        var eventConfig = {
    'latitude': latt,
    'longitude': long,
    'key': 'AIzaSyAlSRr4hhyH1TptRNZckM0bpM1oK-vGjyk'
};
         console.log(eventConfig.latitude);
        es.search({
            "lat": eventConfig.latitude,
            "lng": eventConfig.longitude,
            'distance':results.response,
            'accessToken':'EAACRcRQcZABYBALLsXvu9wRGDnnhsS2r9ranl7DdkY2g41DSEVlafyFDZBzu0D1nxeaTmlYlbiqer6pjiOwB5yMYIrinsUMzGzgPeMofGVxJ9Kpw0CNWi5gvCAaVUmrbVkRCbwoZB4weDZBldN2tpeczB0mKxW6oDo1BWj1pSQZDZD'
           }).then(function (events) {
               name=events.events[0].name;
              //console.log(JSON.stringify(name=events.events[0].name));
           }).catch(function (error) {
              console.error(JSON.stringify(error));
           }).then(function(){
           facebookEvents=name;
});
next();
    },
    function(session){
        console.log(facebookEvents.event[0]);
    }

]).triggerAction({
    matches: 'ServicesType.eventsFaceboo'
});
function showEvent(eventName,session){
     var msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel);
                msg.attachments([
                    new builder.HeroCard(session)
                        .title(eventName)
                ]);
                session.send(msg)
}

//Functions for getting Images-requests
function httpGet(url, callback) {
    const options = {
        url: url,
        json: true,
        method: 'GET',
        qs: {
            client_id: 'NAGACSAFQSQIWKU535EUNQSJUBO5DW01VVST0C312AV04GAZ',
            client_secret: 'VP0SWQZWDWAHGSGHBOIVK3W4GAPIE1MTYXVGT2REZWOBZW3V',
            v: '20171114',
            limit: 1
        }
    };
    request(options,
        function (err, res, body) {
            callback(err, body);
        }
    );
}
  function httpGetGoogle(url, callback) {
    const options = {
        url: url,
        json: true,
        method: 'GET'
    }
    request(options,
        function (err, res, body) {
            callback(err, body);
        }
    );
}

function findPlaces(session, results) {
    var places = [];
    session.dialogData.topothesia = results;
    var params = {
        "near": session.dialogData.topothesia,
        "query": what_type,
        "limit": 5
    };

    foursquare.exploreVenues(params, function (error, venues) {
        if (!error) {

            for (var i = 0; i < params.limit; i++) {
                console.log(venues.response);
                if (venues.response.groups[0].items[i] != undefined) {
                    places[i] = venues.response.groups[0].items[i].venue;
                   
                }
                else if(venues.response.totalResults==0){
                wrong_location=true;
                console.log('WRONGGGGG');
        }
               
            }


        }
         else if(venues==undefined){
            wrong_location=true;
           //session.beginDialog('Beer');
        }

      if(wrong_location==false){


  const urls = [
                    places[0]!=undefined?'https://api.foursquare.com/v2/venues/' + places[0].id + '/photos':'https://api.foursquare.com/v2/venues/' + '4d512ffbabb45941e8c2c018' + '/photos'
                    ,
                    places[1]!=undefined?'https://api.foursquare.com/v2/venues/' + places[1].id + '/photos':'https://api.foursquare.com/v2/venues/' + '4d512ffbabb45941e8c2c018' + '/photos'
                    ,
                    places[2]!=undefined?'https://api.foursquare.com/v2/venues/' + places[2].id + '/photos':'https://api.foursquare.com/v2/venues/' + '4d512ffbabb45941e8c2c018' + '/photos'
                    ,
                    places[3]!=undefined?'https://api.foursquare.com/v2/venues/' + places[3].id + '/photos':'https://api.foursquare.com/v2/venues/' + '4d512ffbabb45941e8c2c018' + '/photos'
                    ,
                    places[4]!=undefined?'https://api.foursquare.com/v2/venues/' + places[4].id + '/photos':'https://api.foursquare.com/v2/venues/' + '4d512ffbabb45941e8c2c018' + '/photos'


                ];
            async.map(urls, httpGet, function (err, res) {
                if (err) return console.log(err);


                var msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel);
                msg.attachments([
                    places[0]!=undefined?new builder.HeroCard(session)
                        .title(places[0].name)
                        .subtitle(places[0].location.address + "-" + places[0].location.city + " - " + places[0].contact.phone)
                        .buttons([builder.CardAction.openUrl(session, "https://foursquare.com/v/" + places[0].name + "/" + places[0].id, session.userData.lingua == 'greek' ?"Μια καλύτερη ματιά?":"View more?")])
                        .images([builder.CardImage.create(session, res[0].response.photos.items[0] != undefined ? "" + res[0].response.photos.items[0].prefix + "300x300" + res[0].response.photos.items[0].suffix + "" : "http://www.kashmirnewsobserver.com/newsimages/noimage.jpg")])
                        :null,
                    places[1]!=undefined?new builder.HeroCard(session)
                        .title(places[1].name)
                        .subtitle(places[1].location.address + "-" + places[1].location.city + " - " + places[1].contact.phone)
                        .buttons([builder.CardAction.openUrl(session, "https://foursquare.com/v/" + places[1].name + "/" + places[1].id,session.userData.lingua == 'greek' ?"Μια καλύτερη ματιά?":"View more?")])
                        .images([builder.CardImage.create(session, res[1].response.photos.items[0] != undefined ? "" + res[1].response.photos.items[0].prefix + "300x300" + res[1].response.photos.items[0].suffix + "" : "http://www.kashmirnewsobserver.com/newsimages/noimage.jpg")])
                        :null,
                   places[2]!=undefined?new builder.HeroCard(session)
                        .title(places[2].name)
                        .subtitle(places[2].location.address + "-" + places[1].location.city + " - " + places[2].contact.phone)
                        .buttons([builder.CardAction.openUrl(session, "https://foursquare.com/v/" + places[2].name + "/" + places[2].id, session.userData.lingua == 'greek' ?"Μια καλύτερη ματιά?":"View more?")])
                        .images([builder.CardImage.create(session, res[2].response.photos.items[0] != undefined ? "" + res[2].response.photos.items[0].prefix + "300x300" + res[2].response.photos.items[0].suffix + "" : "http://www.kashmirnewsobserver.com/newsimages/noimage.jpg")])
                        :null,
                   places[3]!=undefined?new builder.HeroCard(session)
                        .title(places[3].name)
                        .subtitle(places[3].location.address + "-" + places[3].location.city + " - " + places[3].contact.phone)
                        .buttons([builder.CardAction.openUrl(session, "https://foursquare.com/v/" + places[3].name + "/" + places[3].id, session.userData.lingua == 'greek' ?"Μια καλύτερη ματιά?":"View more?")])
                        .images([builder.CardImage.create(session, res[3].response.photos.items[0] != undefined ? "" + res[3].response.photos.items[0].prefix + "300x300" + res[3].response.photos.items[0].suffix + "" : "http://www.kashmirnewsobserver.com/newsimages/noimage.jpg")])
                        :null,
                    places[4]!=undefined?new builder.HeroCard(session)
                        .title(places[4].name)
                        .subtitle(places[4].location.address + "-" + places[4].location.city + " - " + places[4].contact.phone)
                        .buttons([builder.CardAction.openUrl(session, "https://foursquare.com/v/" + places[4].name + "/" + places[4].id, session.userData.lingua == 'greek' ?"Μια καλύτερη ματιά?":"View more?")])
                        .images([builder.CardImage.create(session, res[4].response.photos.items[0] != undefined ? "" + res[4].response.photos.items[0].prefix + "300x300" + res[4].response.photos.items[0].suffix + "" : "http://www.kashmirnewsobserver.com/newsimages/noimage.jpg")])
                        :null
                ])
                builder.Prompts.text(session, msg);
            });
      }
      else{
          wrong_location=false;
          changeLocationMsg=true;
          session.beginDialog(what_type);
      }
        
    });
}

function findLocation(session,results){
    if (results) {
        
            var location = results.response.entity;
            var config = {
                'latitude': location.coordinates.lat,
                'longitude': location.coordinates.long,
                'key': 'AIzaSyAlSRr4hhyH1TptRNZckM0bpM1oK-vGjyk'
            };

            geocoding.location(config, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    findPlaces(session, (data.results[2].address_components[1].long_name));
                }
            });
       


    }
}


function findGoogleLocation(session,results){
    if (results) {
        
           var location = results.response.entity;
           getGooglePlaces(session,what_type,location.coordinates.lat,location.coordinates.long);

    }
}
function createDialog(dialogName,intentName,apiName){
    bot.dialog(dialogName,[
    function (session, results, next) {
        what_type = dialogName;
        session.sendTyping();
        if(changeLocationMsg==true){
        session.send('Try once more!');
        quickReplies.LocationPrompt.beginDialog(session);
        changeLocationMsg=false;
        }
        else{
            
            
            quickReplies.LocationPrompt.beginDialog(session);   
        }
        //builder.Prompts.text(session, session.userData.lingua == 'greek' ? "Που θες να απολαύσεις πίτσα?" : 'Where would you like to eat pizza?');
        //next();
    },
    function (session, results, next) {
        session.sendTyping();
        if(apiName=='foursquare'){
             findLocation(session,results);
        }
        else if(apiName=='google'){
             findGoogleLocation(session,results);
        }
       
    
    },
    function (session) {
        session.endConversation();
    }

]).triggerAction({
    matches: intentName
})

}



    function getGooglePlaces(session,type,lat,long){
    const urls = [
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+lat+','+long+'&radius=1000&'+'type='+type+'&key=AIzaSyAW55WpsBa77Zq8XetgAeeSzmz3xwfChvk'
    ]
    console.log(lat);
async.map(urls, httpGetGoogle, function (err, res) {
    if (err) return console.log(err);
    else{
        a=res[0].results[1].name;
        var msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel);
                msg.attachments([
                    new builder.HeroCard(session)
                    .title(a)
                     .subtitle('')
                ]);
                console.log(a);
           
      builder.Prompts.text(session, msg);
        
    }




});

}
