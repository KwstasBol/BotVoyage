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
},
    function(session,results){
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
                builder.CardAction.postBack(session, "food", "Φαγητό"),
                builder.CardAction.postBack(session,"hotels","Διαμονή"),
                builder.CardAction.postBack(session,"transports","Μεταφορές")
            ])
        ]); 
      
         builder.Prompts.text(session,msg);
    },
  
    function(session,results,next){

        if(results.response=="food"){
            
        var msg=new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([  
            new builder.ThumbnailCard(session)
            .buttons([builder.CardAction.postBack(session, "sushi", "Sushi")])
            .images([builder.CardImage.create(session,"https://tse4.mm.bing.net/th?id=OIP.xQXFKMSiGtrXUAEXkMpu0AD6D6&pid=Api")])
            ,
            new builder.ThumbnailCard(session)
            .buttons([ builder.CardAction.postBack(session,"burger","Burger")])
            .images([builder.CardImage.create(session,"https://static.vietnammm.com/images/restaurants/vn/NR50ON5/products/bb_whopper-honeymustard1.png")])
            ,
            new builder.ThumbnailCard(session)
            .buttons([builder.CardAction.postBack(session,"pizza","Pizza")])
            .images([builder.CardImage.create(session,"http://illazzarone.org/wordpress/wp-content/uploads/Il-Porcellini-pizza-250x250.png")])
        ]); 
      
         builder.Prompts.text(session,msg);
        }
        else if(results.response=="hotels"){
            next();
        }
    },
    function(session,results){
        session.dialogData.foodtype=results.response;
        var msg=new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.ThumbnailCard(session)
            .title("Tοποθεσία")
            .buttons([
                builder.CardAction.postBack(session,"text_location","Επιλογή"),
                builder.CardAction.postBack(session,"live_location","Αποστολή")
            ])
        ])

        builder.Prompts.text(session,msg);

    },
    function(session,results){
        if(results.response=="text_location"){
            builder.Prompts.text(session,"Πληκτρολόγησε πόλη,GR ");
        }
        else{
          
        }

    },
    function(session,results){
        var places=[];
        session.dialogData.topothesia=results.response;
           
            var params = {
                "near": session.dialogData.topothesia,
                "query":session.dialogData.foodtype,
                "limit":5
            };
          
            foursquare.getVenues(params, function(error, venues) {
                if (!error) {
                   
                      for(var i=0;i<params.limit;i++){    
                    
                     
                       places[i]=venues.response.venues[i];
                    }

                   console.log(places[2]);
                }
                 
            var msg=new builder.Message(session);
            msg.attachmentLayout(builder.AttachmentLayout.carousel);
            msg.attachments([   
              new builder.HeroCard(session)
              .title(places[0].name)
              .subtitle(places[0].location.address+"-"+places[0].location.city+"-Τηλ:"+places[0].contact.phone)
              .buttons([builder.CardAction.openUrl(session,"https://foursquare.com/v/"+places[0].name+"/"+places[0].id,"Μια καλύτερη ματιά?")])
              .images([builder.CardImage.create(session,"https://igx.4sqi.net/img/general/width960/79834828_PdzQV5BWEodefA_ZGce0UZQ40JCJ-elZRnISUULvpGg.jpg")]),
              new builder.HeroCard(session)
              .title(places[1].name)
              .subtitle(places[1].location.address+"-"+places[1].location.city+"-Τηλ:"+places[1].contact.phone)
              .buttons([builder.CardAction.openUrl(session,"https://foursquare.com/v/"+places[1].name+"/"+places[1].id,"Μια καλύτερη ματιά?")])
              .images([builder.CardImage.create(session,"https://igx.4sqi.net/img/general/width960/29378889_OUN9ldHlAny07E9fOkelPxPEr2m65Et_hx6f2SO3eE8.jpg")]),
              new builder.HeroCard(session)
              .title(places[2].name)
              .subtitle(places[2].location.address+"-"+places[2].location.city+"-Τηλ:"+places[2].contact.phone)
              .buttons([builder.CardAction.openUrl(session,"https://foursquare.com/v/"+places[2].name+"/"+places[2].id,"Μια καλύτερη ματιά?")])
              .images([builder.CardImage.create(session,"https://igx.4sqi.net/img/general/width960/2425631_QeB_Ql0fPoO-t7DuQtbWtqC2tQaJs25TmjbAdVGO0Us.jpg")]),
              new builder.HeroCard(session)
              .title(places[3].name)
              .subtitle(places[3].location.address+"-"+places[3].location.city+"-Τηλ:"+places[3].contact.phone)
              .buttons([builder.CardAction.openUrl(session,"https://foursquare.com/v/"+places[3].name+"/"+places[3].id,"Μια καλύτερη ματιά?")])
              .images([builder.CardImage.create(session,"https://igx.4sqi.net/img/general/width960/13094601_h1WxyNxjDpiqPsoTHTftIPN5gcHnT1elfJ36_eppcvo.jpg")]),
              new builder.HeroCard(session)
              .title(places[4].name)
              .subtitle(places[4].location.address+"-"+places[4].location.city+"-Τηλ:"+places[4].contact.phone)
              .buttons([builder.CardAction.openUrl(session,"https://foursquare.com/v/"+places[4].name+"/"+places[4].id,"Μια καλύτερη ματιά?")])
              .images([builder.CardImage.create(session,"https://igx.4sqi.net/img/general/width960/691450_Slz4a2_sVijQayiMbcd9iAD4dNQDHbYAGXodh0cX90Q.jpg")])
            ]); 
            builder.Prompts.text(session,msg);
            });
           
            
        
        //teleutaio vhma katarakth
    },function(session,results){
        
        
    }
 ]);    

//sunarthsh gia thn dhmiourgia koubiwn me ta magazia


/*
function createMultipleButtons(session,places){
    
    var card={
        "builders":[]
    };
    for(var i=0;i<5;i++){
        var builderas=new builder.ThumbnailCard(session)
    .buttons([ builder.CardAction.postBack(session,places[i].name,places[i].name)])
    .images([builder.CardImage.create(session,places[i])])
    //console.log(builderas.toAttachment().content.buttons);
    card.builders.push(builderas.toAttachment());
    }
    setTimeout(function(){
        console.log(card.builders.content);
    },2000)

   return card.builders;
}
 */
 





    
    




