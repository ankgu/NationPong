"use strict";

var GAME_LENGTH = 5;  // The number of exchanges after which player wins.

var GAME_STATES = {
    PONG: "_PONGMODE", // The user is playing the game.
    START: "_STARTMODE", // Entry point, start the game.
    HELP: "_HELPMODE" // The user is asking for help.
};

var Resources = require("./countries");

var languageString = {
    "en": {
        "translation": {
            "COUNTRIES" : Resources["CountriesDatabase"],
            "GAME_NAME" : "Nation Pong",
            "HELP_MESSAGE": "I will ping with a country name. You will pong with a country name starting with the last letter of my country. We continue ping pong till you pong %s times. To start a new game at any time, say, start game.",
            "ASK_MESSAGE_START": "Would you like to start playing?",
            "STOP_MESSAGE": "Would you like to keep playing?",
            "CANCEL_MESSAGE": "Ok, let\'s play again soon.",
            "NO_MESSAGE": "Ok, we\'ll play another time. Goodbye!",
            "COUNTRY_UNHANDLED": "Try saying a valid country",
            "HELP_UNHANDLED": "Say yes to continue, or no to end the game.",
            "START_UNHANDLED": "Say start to start a new game.",
            "NEW_GAME_MESSAGE": "Welcome to %s. ",
            "WELCOME_MESSAGE": "I will ping with a country name. You will pong with a country name starting with the last letter of my country. We continue ping pong till you pong %s times. Let\'s begin. ",
            "WRONG_COUNTRY_MESSAGE": "Wrong country.",
            "WON_GAME_MESSAGE": "You won.",
            "END_GAME_MESSAGE": "Thank you for playing!"
        }
    }
};

var Alexa = require("alexa-sdk");
var APP_ID = "amzn1.ask.skill.a2bf29a5-7814-4e02-8db5-d162d3e101db";

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageString;
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, pongStateHandlers, helpStateHandlers);
    alexa.execute();
};

var newSessionHandlers = {
    "LaunchRequest": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", true);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", true);
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState("helpTheUser", true);
    },
    "Unhandled": function () {
        var speechOutput = this.t("START_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    }
};

var startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    "StartGame": function (newGame) {
        
        var speechOutput = newGame ? this.t("NEW_GAME_MESSAGE", this.t("GAME_NAME")) + this.t("WELCOME_MESSAGE", GAME_LENGTH.toString()) : "";
                
        var countries = populateCountries(this.t("COUNTRIES"));
        var alexaCountry = countries[0];
        countries = removeCountry(countries, alexaCountry);
        
        var repromptText = "Ping " + alexaCountry + ".";
        speechOutput += repromptText;

        Object.assign(this.attributes, {
            "country": alexaCountry,
            "repromptText": repromptText,
            "countries": countries,
            "score": 0
        });

        this.handler.state = GAME_STATES.PONG;
        this.emit(":askWithCard", speechOutput, repromptText, this.t("GAME_NAME"), alexaCountry);
    }
});

var pongStateHandlers = Alexa.CreateStateHandler(GAME_STATES.PONG, {
    "NationIntent": function () {
        handleUserCountry.call(this, false);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", false);
    },
    "AMAZON.RepeatIntent": function () {
        this.emit(":ask", this.attributes["repromptText"], this.attributes["repromptText"]);
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState("helpTheUser", false);
    },
    "AMAZON.StopIntent": function () {
        handleUserCountry.call(this, true);
    },
    "AMAZON.CancelIntent": function () {
        handleUserCountry.call(this, true);
    },
    "Unhandled": function () {
        var speechOutput = this.t("COUNTRY_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in trivia state: " + this.event.request.reason);
    }
});

var helpStateHandlers = Alexa.CreateStateHandler(GAME_STATES.HELP, {
    "helpTheUser": function (newGame) {
        var askMessage = newGame ? this.t("ASK_MESSAGE_START") : this.t("STOP_MESSAGE");
        var speechOutput = this.t("HELP_MESSAGE", GAME_LENGTH) + askMessage;
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", false);
    },
    "AMAZON.RepeatIntent": function () {
        var newGame = (this.attributes["country"] && this.attributes["repromptText"]) ? false : true;
        this.emitWithState("helpTheUser", newGame);
    },
    "AMAZON.HelpIntent": function() {
        var newGame = (this.attributes["country"] && this.attributes["repromptText"]) ? false : true;
        this.emitWithState("helpTheUser", newGame);
    },
    "AMAZON.YesIntent": function() {
        if (this.attributes["country"] && this.attributes["repromptText"]) {
            this.handler.state = GAME_STATES.PONG;
            this.emitWithState("AMAZON.RepeatIntent");
        } else {
            this.handler.state = GAME_STATES.START;
            this.emitWithState("StartGame", false);
        }
    },
    "AMAZON.NoIntent": function() {
        var speechOutput = this.t("NO_MESSAGE");
        this.emit(":tell", speechOutput);
    },
    "AMAZON.StopIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "Unhandled": function () {
        var speechOutput = this.t("HELP_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in help state: " + this.event.request.reason);
    }
});

function findNextCountry(countries, country) {

    for (var i=countries.length-1; i>=0; i--) {
        if (doesCountryFollowRules(country, countries[i])) {
            return countries[i];
        }
    }
    return "";
}

function doesCountryFollowRules(previous, current) {
    var previousLower = previous.toLowerCase();
    var currentLower = current.toLowerCase();
    if(previousLower.slice(-1) == currentLower.slice(0, 1)) {
        return true;
    }
    return false;
}

function removeCountry(countries, country) {
    for (var i=countries.length-1; i>=0; i--) {
        if (countries[i] == country) {
            countries.splice(i, 1);
            break;
        }
    }
    return countries;
}

function handleUserCountry(userGaveUp) {
    
    var currentScore = parseInt(this.attributes.score);
    var alexaCountry = this.attributes["country"];
    var countries = this.attributes["countries"];
    var speechOutput = "";
    
    if (userGaveUp) {

        alexaCountry = findNextCountry(countries, alexaCountry);
        if (alexaCountry == "") {
            alexaCountry = "not available";
        }

        speechOutput = "Next country could have been " + alexaCountry + " . " + this.t("END_GAME_MESSAGE");
        this.emit(":tellWithCard", speechOutput, this.t("GAME_NAME"), alexaCountry);
    }
    else {

        var userCountry = extractUserCountryFromIntent(countries, this.event.request.intent);
        
        if (doesCountryFollowRules(alexaCountry, userCountry)) {

            countries = removeCountry(countries, userCountry);
            
            currentScore++;
            if(currentScore == GAME_LENGTH) {
                
                speechOutput = this.t("WON_GAME_MESSAGE") + this.t("END_GAME_MESSAGE");
                this.emit(":tell", speechOutput, speechOutput);
            }
            else {
                alexaCountry = findNextCountry(countries, userCountry);                
                
                if(alexaCountry != "") {
                    countries = removeCountry(countries, alexaCountry);

                    var repromptText = "Ping " + alexaCountry + ".";
                    Object.assign(this.attributes, {
                        "country": alexaCountry,
                        "repromptText": repromptText,
                        "countries": countries,
                        "score": currentScore
                    });

                    speechOutput = "Score is " + currentScore + ". " + repromptText;
                    this.emit(":askWithCard", speechOutput, repromptText, this.t("GAME_NAME"), alexaCountry);
                }
                else {
                    speechOutput = this.t("WON_GAME_MESSAGE") + this.t("END_GAME_MESSAGE");
                    this.emit(":tell", speechOutput, speechOutput);
                }
            }
        }
        else {
            
            Object.assign(this.attributes, {
                "country": alexaCountry,
                "repromptText": alexaCountry,
                "countries": countries,
                "score": currentScore
            });

            speechOutput = this.t("WRONG_COUNTRY_MESSAGE") + " " + alexaCountry + ".";
            this.emit(":askWithCard", speechOutput, speechOutput, this.t("GAME_NAME"), alexaCountry);                    
        }
    }    
}

function populateCountries(countries) {
    
    var currentIndex = countries.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = countries[currentIndex];
        countries[currentIndex] = countries[randomIndex];
        countries[randomIndex] = temporaryValue;
    }
  
    return countries;   
}

function isValidCountry(countries, country) {

    for (var i = countries.length - 1; i >= 0; i--) {
        if (countries[i] == country) {
            return true;
        }
    }
    return false;
}

function extractUserCountryFromIntent(countries, intent) {

    var nationSlotFilled = intent && intent.slots && intent.slots.Nation && intent.slots.Nation.value;
    var nationSlotIsCountry = nationSlotFilled && isValidCountry(countries, intent.slots.Nation.value);
    return nationSlotIsCountry ? intent.slots.Nation.value : "";

}