# NationPong

This is the repository for an Alexa Skill Kit (ASK) based game of naming countries.

## Game Play

The user can launch the game on an Alexa-enabled device by saying "Start Nation Pong". The user may also choose to use the words "Launch/Open" instead of "Start".
Alexa starts by saying a country name at random, for example "Ping India". The user needs to reply to this ping by saying "Pong" followed by a country name that starts with the last letter of the name said by Alexa.
For instance, Alexa's "Ping India" can be reolied with "Pong Australia". Alexa contrinues following the same rule. A country's anme may not be repeated through the game.
The user wins the game if they successfully complete five such ping-pongs.

## Supported voice interaction

Starting or restarting the game - Start/Restart/Open/Launch
Seeking help regarding rules - Help
Repeating the last name - Repeat
Replying to Alexa - Pong <country>
