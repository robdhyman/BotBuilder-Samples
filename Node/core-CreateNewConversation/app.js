// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

var userStore = [];
var bot = new builder.UniversalBot(connector, function (session) {


    // store user's address
    var address = session.message.address;
    userStore.push(address);

    // end current dialog
    session.endDialog('You\'ve activated the 8-Ball, we will predict your future shortly...');
});

// array of 8-ball answers, why are there so many more than eight?
var answers = [
  
'It is certain',
'It is decidedly so',
'Without a doubt',
'Yes definitely',
'You may rely on it',
'As I see it, yes',
'Most likely',
'Outlook good',
'Yes',
'Signs point to yes',
'Better not tell you now',
'It\'s.... Complicated',
];

var answer;

// Every 5 seconds, check for new registered users and start a new dialog
setInterval(function () {
    var newAddresses = userStore.splice(0);
    newAddresses.forEach(function (address) {

        console.log('Starting 8-Ball for address: ', address);

        // new conversation address, copy without conversationId
        var newConversationAddress = Object.assign({}, address);
        delete newConversationAddress.conversation;

        // start survey dialog
        bot.beginDialog(newConversationAddress, 'survey', null, function (err) {
            if (err) {
                // error ocurred while starting new conversation. Channel not supported?
                bot.send(new builder.Message()
                    .text('This channel does not support this operation: ' + err.message)
                    .address(address));
            }
        });

    });
}, 1000);

bot.dialog('survey', [
    function (session) {
        builder.Prompts.text(session, 'Hello, what would you ask of the 8-ball?');
    },

    //8-ball is "shaken" and an answer is drawn at random
    function (session, results) {
        session.userData.name = results.response;
        //builder.Prompts.number(session, 'Hmmm... ' + results.response);
        answer = answers[Math.floor(Math.random() * answers.length)];
        builder.Prompts.text(session, 'Hmmm... ' + answer);

    },

    /**
    *   Here's where I'd implement sentiment analysis to give a more robust 
    *   array of responses (i.e. "Would you like to shake the 8-ball again?", 
    *   "Sorry for the bad news", or "Congratulations!", etc);
    **/


    // this funciton to be replaced by more robust solution in comment above
   function (session, results) {
        session.endDialog('Ask another?');
    },


]);