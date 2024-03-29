Tournament and Money Mods
========================================================================
Hi guys!  Orivexes here, with a bit of instructions on how to use this github.

I'll be honest--I'm not a pro with this software.  So the most helpful thing I can suggest is how to get my mods into an existing PS! installation.

The tour mod is loosely based off of one made by a fellow named Steve.  I don't really know Steve, but he rocks, so kudos to him.  I used some similar formats and command names for familiarity's sake.


I guess I'll say hi as well, this is Nollan. Ok, so for those with the newer servers (ones running the command-parser.js and such), the tour commands do not work for you, due to several commands changes.
After some various fixing/editing, I have made a working tour command for these later servers.
To be modest though, Orivexes definitely deserves more or less all the credit for these commands, not me. I simply edited them a bit.
Anyways, if you want to try the tour commands, pull these from my server's coding:

- config/commands.js
- commands-parser.js
- users.js
- rooms.js

I have tried my best to mark the edited sections with //start tour commands and //end tour commands, etc. 
If you have any problems with pulling these feel free to ask me for help.

Pokémon Showdown
========================================================================

Pokémon Showdown is a simulator of Pokémon battles. It currently supports singles battles in Generations 4-5 (HGSS, BW, BW2).

This repository contains the files needed to set up your own Pokémon Showdown server. Note that to set up a server, you'll also need a server computer.

You can use your own computer as a server, but for other people to connect to your computer, you'll need to expose a port (default is 8000 but you can choose a different one) to connect to, by setting up any firewalls you might have to allow that port through to you (this sometimes isn't possible on certain internet connections).


Installing
------------------------------------------------------------------------

Pokémon Showdown requires [node.js][1], either v0.6.3 through v0.8.22, or v0.10.2 and up. Install `node.js` if you don't have it yet; the latest stable version is a good choice to install.

Next, obtain a copy of Pokémon Showdown. If you're reading this outside of GitHub, you've probably already done this. If you're reading this in GitHub, there's a "Clone" button in the top left, or if you're really lazy, there's a "ZIP" download button. I recommend the Clone method - it's more time-consuming to set up, but much easier to update.

Pokémon Showdown is installed and run using a command line. In Mac OS X, open `Terminal` (it's in Utilities). In Windows, open `Command Prompt` (type `cmd` into the Start menu and it should be the first result). Type this into the command line:

    cd LOCATION

Replace `LOCATION` with the location Pokémon Showdown is in (ending up with, for instance, `cd "~/Downloads/Pokemon-Showdown"` or `cd "C:\Users\Bob\Downloads\Pokemon-Showdown\"`).

This will set your command line's location to Pokémon Showdown's folder. You'll have to do this each time you open a command line to run commands for Pokémon Showdown.

To install dependencies, run the command:

    npm install

Copy `config/config-example.js` into `config/config.js`, and edit as you please.

Congratulations, you're done setting up Pokémon Showdown.

Now, to start Pokémon Showdown, run the command:

    node app.js

You can also specify a port:

    node app.js 8000

Visit your server at `http://SERVER:8000`

Replace `SERVER` with your server domain or IP. Replace `8000` with your port if it's not `8000` (the default port).

Yes, you can test even if you are behind a NAT without port forwarding: `http://localhost:8000` will connect to your local machine. Some browser setups might prevent this sort of connection, however (NoScript, for instance). If you can't get connecting locally to work in Firefox, try Chrome.

You will be redirected to `http://SERVER.psim.us`. The reason your server is visited through `psim.us` is to make it more difficult for servers to see a user's password in any form, by handling logins globally. You can embed this in an `iframe` in your website if the URL is a big deal with you.

If you truly want to host the client yourself, there is [a repository for the Pokémon Showdown Client][3]. It's not recommended for beginners, though.

  [1]: http://nodejs.org/
  [2]: https://github.com/joyent/node/pull/5016
  [3]: https://github.com/Zarel/Pokemon-Showdown-Client


Setting up an Administrator account
------------------------------------------------------------------------

Once your server is up, you probably want to make yourself an Administrator (~) on it.

### config/usergroups.csv

To become an Administrator, create a file named `config/usergroups.csv` containing

    USER,~

Replace `USER` with the username that you would like to become an Administrator.

This username must be registered. If you do not have a registered Pokémon Showdown account, you can create one using [the registration form][4].

Once you're an administrator, you can promote/demote others easily with the `/admin`, `/leader`, `/mod`, etc commands.

  [4]: http://pokemonshowdown.com/forum/register


Browser support
------------------------------------------------------------------------

Pokémon Showdown currently supports, in order of preference:

 - Chrome
 - Firefox
 - Safari
 - Chrome/Firefox/Safari for various mobile devices
 - Opera
 - Firefox for Android
 - IE9+

IE8 support can technically be added without too much difficulty, but it doesn't run PS fast enough to be usable.

As for older browsers (Firefox 3.6), I won't go out of my way to support them, but if there's a simple fix, you can suggest it to me and I'll implement it.


Community
------------------------------------------------------------------------

The Pokémon Showdown development IRC channel is `#showdown` at `irc.synirc.net`.

[The Pokémon Showdown forums][5] are hosted on Smogon Forums.

  [5]: http://www.smogon.com/forums/forumdisplay.php?f=209


License
------------------------------------------------------------------------

Pokémon Showdown's server is distributed under the terms of the [MIT License][6].

  [6]: https://github.com/Zarel/Pokemon-Showdown/blob/master/LICENSE


Credits
------------------------------------------------------------------------

Owner

- Guangcong Luo [Zarel] - Development, Design

Senior Staff

- Cathy J. Fitzpatrick [cathyjf] - Development

Staff

- Bill Meltsner [bmelts] - Development
- Mathieu Dias-Martins [Marty-D] - Research (game mechanics), Development

Contributors

- Andrew Goodsell [Zracknel] - Art (battle weather backdrops)
- Cody Thompson [Rising_Dusk] - Development
- Juanma Serrano [Joim] - Development
- Kyle Dove [Kyle_Dove] - Art (battle backdrops)
- Samuel Teo [Yilx] - Art (main background)
- [The Immortal] - Development
