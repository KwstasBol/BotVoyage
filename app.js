var restify = require('restify');
var builder = require('botbuilder');
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var foursquare = (require('foursquarevenues'))('NAGACSAFQSQIWKU535EUNQSJUBO5DW01VVST0C312AV04GAZ', 'VP0SWQZWDWAHGSGHBOIVK3W4GAPIE1MTYXVGT2REZWOBZW3V');
const request = require('request');
var fs = require('fs');
var async = require('async');
var Wit = require('node-wit').Wit;
var what_type = "";
var language="";
var client = new Wit({
    accessToken: 'U6LYAW372VJ5QJ5VRCQNTFM7HLQNX3MU'
});



// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});


//Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata
});

//Listen for messages from users 
server.post('/api/messages', connector.listen());

//Universal dialog
var bot = new builder.UniversalBot(connector, [

    //Step 1- Read from entity Language 
    function (session, results) {

        //Check if it is greek, then begin Greek_Intro
        client.message(session.message.text, {}).then((data) => {
            if (data.entities.Language != undefined) {
                language="greek";
                session.beginDialog('Intro');
            }
            //Else begin English_Intro
            else {
                language="english";
                session.beginDialog("Intro");
            }
        });
    },
    //Step 2- End of dialog
    function (session, results) {
        session.endDialog();
    }
]);

//Intro
bot.dialog('Intro', [
    //Step 1- Welcome the user
    function (session) {
        builder.Prompts.text(session, language=='greek'?'Καλώς Ήρθατε!Πως μπορώ να βοηθήσω?':'Hey there!How can i help you?');
    },
    //Step 2- Begin Greek_Core
    function (session) {
        session.beginDialog('Core');
    }]);

//Core - The basic menu
bot.dialog('Core', [
    //Step 1- Regarding the input, a new dialog begins
    function (session, results, next) {
        client.message(session.message.text, {}).then((data) => {
            var wit_value = data.entities.Category_Type[0].value;
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
            else {
                session.send(language=='greek'?'Με συγχωρείς, δεν κατάλαβα το αίτημα σου':'Sorry i did not understand you');
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
        builder.Prompts.text(session, language=='greek'?"Τι τραβά η όρεξη σου? Πίτσα,σουβλάκι,μεξικάνικο,burger..? Μη μου πεις sushi :P":'Would you like pizza,sushi,mexican or burger?');
    },
    //Step 2- Find the category with wit.ai
    function (session, results) {
        client.message(results.response, {}).then((data) => {
            var wit_value = JSON.stringify(data.entities.Food_Type[0].value);
            what_type = wit_value;
        });
        builder.Prompts.text(session, language=='greek'?"Εισαγωγή τοποθεσίας":'Enter location');
    },
    //Step 3- Find the venues via Foursquare
    function (session, results) {
        findPlaces(session, results);
    },
    //Step 4- Begin the basic dialog
    function (session, results) {
        session.beginDialog('Core');
    }
]);

//Drinks
bot.dialog('Drinks', [
    //Step 1- User input for which category of drink
    function (session) {
        builder.Prompts.text(session,language=='greek'?"Τι θέλεις να πιείς?Κοκτέιλ,Μπιρίτσα,Κρασάκι..":'Would you like to drink beer,cocktail or wine?' );
    },
    //Step 2- Find the category with wit.ai
    function (session, results) {
        client.message(results.response, {}).then((data) => {
            var wit_value = JSON.stringify(data.entities.Drink_Type[0].value)
            what_type = wit_value;
        });
        builder.Prompts.text(session, language=='greek'?"Εισαγωγή τοποθεσίας":'Enter location');
    },
    //Step 3- Find the venues via Foursquare
    function (session, results) {
        findPlaces(session, results);
    },
    //Step 4- Begin the basic dialog
    function (session) {
        session.beginDialog('Core');
    }
]);

//Hospitals
bot.dialog('Hospitals', [
    //Step 1- User input 
    function (session) {
        client.message(session.message.text, {}).then((data) => {
            var wit_value = JSON.stringify(data.entities.Category_Type[0].value)
            what_type = wit_value;
        });
        builder.Prompts.text(session, language=='greek'?"Εισαγωγή τοποθεσίας":'Enter location');
    },
    //Step 2- Find the venues via Foursquare
    function (session, results) {
        findPlaces(session, results);
    },
    //Step 3- Begin the basic dialog
    function (session, results) {
        session.beginDialog('Core');
    }
]);

//Help
bot.dialog('Help', [

    function (session) {
        builder.Prompts.text(session, "Μπορείς να με ρωτήσεις για φαγητό,ποτό,διαμονή,πτήση,νοσοκομεία,αλλά και κάτι πιο καλλιτεχνικό");

    },
    function (session) {
        session.beginDialog('Core');
    }
]).triggerAction({
    matches: /^help$/i
});



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

function findPlaces(session, results) {
    var places = [];
    session.dialogData.topothesia = results.response;
    console.log(session.dialogData.foodtype);
    var params = {
        "near": session.dialogData.topothesia,
        "query": what_type,
        "limit": 5
    };

    foursquare.exploreVenues(params, function (error, venues) {
        if (!error) {

            for (var i = 0; i < params.limit; i++) {
                if (venues.response.groups[0].items[i] != undefined) {
                    places[i] = venues.response.groups[0].items[i].venue;
                }
                else {

                }
            }


        }

        if (venues.response.totalResults == 1) {
            session.send("Δεν υπήρξε αποτέλεσμα..Δοκίμασε κάτι άλλο, είτε να φάς, είτε να πιείς,εσυ ξέρεις!");
            session.beginDialog('Core');
        }
        else {



            const urls = [
                'https://api.foursquare.com/v2/venues/' + places[0].id + '/photos',
                'https://api.foursquare.com/v2/venues/' + places[1].id + '/photos',
                'https://api.foursquare.com/v2/venues/' + places[2].id + '/photos',
                'https://api.foursquare.com/v2/venues/' + places[3].id + '/photos',
                'https://api.foursquare.com/v2/venues/' + places[4].id + '/photos'


            ];
            async.map(urls, httpGet, function (err, res) {
                if (err) return console.log(err);


                var msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel);
                msg.attachments([
                    new builder.HeroCard(session)
                        .title(places[0].name)
                        .subtitle(places[0].location.address + "-" + places[0].location.city + " - " + places[0].contact.phone)
                        .buttons([builder.CardAction.openUrl(session, "https://foursquare.com/v/" + places[0].name + "/" + places[0].id, "Μια καλύτερη ματιά?")])
                        .images([builder.CardImage.create(session, res[0].response.photos.items[0] != undefined ? "" + res[0].response.photos.items[0].prefix + "300x300" + res[0].response.photos.items[0].suffix + "" : "http://www.kashmirnewsobserver.com/newsimages/noimage.jpg")]),
                    new builder.HeroCard(session)
                        .title(places[1].name)
                        .subtitle(places[1].location.address + "-" + places[1].location.city + " - " + places[1].contact.phone)
                        .buttons([builder.CardAction.openUrl(session, "https://foursquare.com/v/" + places[1].name + "/" + places[1].id, "Μια καλύτερη ματιά?")])
                        .images([builder.CardImage.create(session, res[1].response.photos.items[0] != undefined ? "" + res[1].response.photos.items[0].prefix + "300x300" + res[1].response.photos.items[0].suffix + "" : "http://www.kashmirnewsobserver.com/newsimages/noimage.jpg")]),
                    new builder.HeroCard(session)
                        .title(places[2].name)
                        .subtitle(places[2].location.address + "-" + places[1].location.city + " - " + places[2].contact.phone)
                        .buttons([builder.CardAction.openUrl(session, "https://foursquare.com/v/" + places[2].name + "/" + places[2].id, "Μια καλύτερη ματιά?")])
                        .images([builder.CardImage.create(session, res[2].response.photos.items[0] != undefined ? "" + res[2].response.photos.items[0].prefix + "300x300" + res[2].response.photos.items[0].suffix + "" : "http://www.kashmirnewsobserver.com/newsimages/noimage.jpg")]),
                    new builder.HeroCard(session)
                        .title(places[3].name)
                        .subtitle(places[3].location.address + "-" + places[3].location.city + " - " + places[3].contact.phone)
                        .buttons([builder.CardAction.openUrl(session, "https://foursquare.com/v/" + places[3].name + "/" + places[3].id, "Μια καλύτερη ματιά?")])
                        .images([builder.CardImage.create(session, res[3].response.photos.items[0] != undefined ? "" + res[3].response.photos.items[0].prefix + "300x300" + res[3].response.photos.items[0].suffix + "" : "http://www.kashmirnewsobserver.com/newsimages/noimage.jpg")]),
                    new builder.HeroCard(session)
                        .title(places[4].name)
                        .subtitle(places[4].location.address + "-" + places[4].location.city + " - " + places[4].contact.phone)
                        .buttons([builder.CardAction.openUrl(session, "https://foursquare.com/v/" + places[4].name + "/" + places[4].id, "Μια καλύτερη ματιά?")])
                        .images([builder.CardImage.create(session, res[4].response.photos.items[0] != undefined ? "" + res[4].response.photos.items[0].prefix + "300x300" + res[4].response.photos.items[0].suffix + "" : "http://www.kashmirnewsobserver.com/newsimages/noimage.jpg")])
                ])
                builder.Prompts.text(session, msg);
            });

        }
    });
}