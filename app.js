var restify = require('restify');
var builder = require('botbuilder');
var express=require("express");
var app=express();
var bodyParser=require("body-parser");
var foursquare = (require('foursquarevenues'))('NAGACSAFQSQIWKU535EUNQSJUBO5DW01VVST0C312AV04GAZ', 'VP0SWQZWDWAHGSGHBOIVK3W4GAPIE1MTYXVGT2REZWOBZW3V');
var current_location=require('current-location');

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




var bot = new builder.UniversalBot(connector,[
    
    
    //Waterfall step 1:Send language flag via a hero card at the beginning of conversation
    function(session,results,next){
    //session.userData={};
    if(session.userData.country==undefined){
        session.userData.country="";        
        var msg=new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
        new builder.ThumbnailCard(session)
        .images([
            builder.CardImage.create(session, "http://img.freeflagicons.com/thumb/round_icon/greece/greece_256.png")
        ])
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
}
    else{
        next();
    }
},
    //Waterfall step 2:Redirect to dialog compared to the language
    function(session,results){
    
    //If it is first time, add to the profile the language
    if(session.userData.country==""){
        if(results.response=="grcontinue"){
          session.userData.country="Greece";
          session.save();
          session.beginDialog("Greek");
        }
        else{
            session.userData.country="England";  
            session.save();
            session.beginDialog('English');
        }
    }
    //If a user exists,begin Language Dialog
    else{
        if( session.userData.country=="Greece"){
            session.beginDialog("Greek");
        }
        else{
            session.beginDialog('English');
        }
    }
},
    //Waterfall step 3:End of dialog
    function(session,results){
        session.endDialog();
}
]);

//Greek Dialog
bot.dialog('Greek',[
    function(session){
        //Waterfall step 1: Welcmome and cards with the choices
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
        //Waterfall step 2: Choices
    function(session,results,next){

        //If's regarding the choice

        //Food
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
         //Hotels
        else if(results.response=="hotels"){
            next();
        }
    },
    //Waterfall step 3: Enter Location
    function(session,results){
        session.dialogData.foodtype=results.response;
        

        builder.Prompts.text(session,"Επιλογή τοποθεσίας π.χ: Athens,GR");

    },
    //Waterfall step 4: Foursquare Request and show places
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
            
    },
    //Waterfall step 5: End of dialog
    function(session,results){
        session.endDialog();
    }
 ]);    

//English Dialog
 bot.dialog('English',[
    function(session){
        session.send("Welcome!");
        var msg=new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.ThumbnailCard(session)
            .buttons([
                builder.CardAction.postBack(session, "food", "Food"),
                builder.CardAction.postBack(session,"hotels","Stay"),
                builder.CardAction.postBack(session,"transports","Transports")
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
        builder.Prompts.text(session,"Enter location e.g:London,ENG");

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
        
        session.endDialog();
    }
 ]);    



    
    




