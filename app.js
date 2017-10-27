var restify = require('restify');
var builder = require('botbuilder');
var express=require("express");
var app=express();
var bodyParser=require("body-parser");
var foursquare = (require('foursquarevenues'))('NAGACSAFQSQIWKU535EUNQSJUBO5DW01VVST0C312AV04GAZ', 'VP0SWQZWDWAHGSGHBOIVK3W4GAPIE1MTYXVGT2REZWOBZW3V');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});


// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());




//Step 1:Send language flag via a hero card at the beginning of conversation
var bot = new builder.UniversalBot(connector,[
    
    function(session){
    var msg=new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    msg.attachments([
        new builder.ThumbnailCard(session)
        .images([builder.CardImage.create(session, "http://img.freeflagicons.com/thumb/round_icon/greece/greece_256.png")])
        .buttons([
            builder.CardAction.postBack(session, "grcontinue", "Συνεχίστε")
        ]),
        
        new builder.ThumbnailCard(session)
        .images([builder.CardImage.create(session, "http://img.freeflagicons.com/thumb/round_icon/united_kingdom/united_kingdom_256.png")])
        .buttons([
            builder.CardAction.postBack(session, "engcontinue", "Continue")
        ])
        
    ]); 
  
     builder.Prompts.text(session,msg);
},function(session,results){
    if(results.response=="grcontinue"){
        session.beginDialog('Greek');
    }
    else{
        session.beginDialog('English');
    }
    

},
function(session,results){
    session.endDialog();
}
]);

 bot.dialog('Greek',[
    function(session){
        session.send("Καλώς Ήρθατε!");
        var msg=new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.ThumbnailCard(session)
            .buttons([
                builder.CardAction.postBack(session, "food", "Φαγητό")
            ])
        ]); 
      
         builder.Prompts.text(session,msg);
    },
    function(session,results){
        var places=[];
        if(results.response=="food"){
           
            var params = {
                "near": "Ilion,GR",
                "query":"sushi",
                "limit":5
            };
          
            foursquare.getVenues(params, function(error, venues) {
                if (!error) {
                   

                    /*for(var i=0;i<params.limit;i++){    
                    
                        
                         //session.send(venues.response.venues[i].name+"--"+venues.response.venues[i].contact.phone);
                    }*/
                      for(var i=0;i<params.limit;i++){    
                    
                        
                       places[i]=venues.response.venues[i];
                    }

                   
                }
                 
            var msg=new builder.Message(session);
            msg.attachmentLayout(builder.AttachmentLayout.carousel);
            msg.attachments([
                new builder.ThumbnailCard(session)
                .buttons(
                    createMultipleButtons(session,places)
                )
            ]); 
            builder.Prompts.text(session,msg);
            });
           
        }

    },function(session,results){

    }
 ]);    

//sunarthsh gia thn dhmiourgia koubiwn me ta magazia
function createMultipleButtons(session,places){
    var list=[];
    for(var i=0;i<5;i++){
        list[i]=builder.CardAction.postBack(session, places[i].name, places[i].name);
    }

    return list;
}

    
    




