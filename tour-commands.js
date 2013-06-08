var crypto = require('crypto');

//tour variables

var tourActive = false;
var tourSigyn = false;
var tourBracket = [];
var tourSignup = [];
var tourTier = '';
var tourRound = 0;
var tourSize = 0;
var tourMoveOn = [];
var tourRoundSize = 0;

var tourTierList = ['OU','UU','RU','NU','Random Battle','Ubers','Tier Shift','Challenge Cup 1-vs-1','Hackmons','Balanced Hackmons','LC','Smogon Doubles','Doubles Random Battle','Doubles Challenge Cup','Glitchmons'];
var tourTierString = '';
for (var i = 0; i < tourTierList.length; i++) {
  if ((tourTierList.length - 1) > i) {
	tourTierString = tourTierString + tourTierList[i] + ', ';
	} else {
	tourTierString = tourTierString + tourTierList[i];
	}
}

function parseCommandLocal(user, cmd, target, room, socket, message) {
  if (!room) return;
	switch (cmd) {
	case 'cmd':
		var spaceIndex = target.indexOf(' ');
		var cmd = target;
		if (spaceIndex > 0) {
			cmd = target.substr(0, spaceIndex);
			target = target.substr(spaceIndex+1);
		} else {
			target = '';
		}
		if (cmd === 'userdetails') {
			if (!room) return false;
			var targetUser = Users.get(target);
			if (!targetUser) {
				emit(socket, 'command', {
					command: 'userdetails',
					userid: toId(target),
					rooms: false
				});
				return false;
			}
			var roomList = {};
			for (var i in targetUser.roomCount) {
				if (i==='global') continue;
				var targetRoom = Rooms.get(i);
				if (!targetRoom) continue;
				var roomData = {};
				if (targetRoom.battle) {
					var battle = targetRoom.battle;
					roomData.p1 = battle.p1?' '+battle.p1:'';
					roomData.p2 = battle.p2?' '+battle.p2:'';
				}
				roomList[i] = roomData;
			}
			if (!targetUser.roomCount['global']) roomList = false;
			var userdetails = {
				command: 'userdetails',
				userid: targetUser.userid,
				avatar: targetUser.avatar,
				rooms: roomList,
				room: room.id
			};
			if (user.can('ip', targetUser)) {
				var ips = Object.keys(targetUser.ips);
				if (ips.length === 1) {
					userdetails.ip = ips[0];
				} else {
					userdetails.ips = ips;
				}
			}
			emit(socket, 'command', userdetails);
		} else if (cmd === 'roomlist') {
			emit(socket, 'command', {
				command: 'roomlist',
				rooms: Rooms.global.getRoomList(true),
				room: 'lobby'
			});
		}
		return false;
		break;
    
//tour commands
  case 'tour':
	case 'starttour':
		if (!user.can('broadcast')) {
			emit(socket, 'console', 'You do not have enough authority to use this command.');
			return false;
		}
		if (tourActive || tourSigyn) {
			emit(socket, 'console', 'There is already a tournament running, or there is one in a signup phase.');
			return false;
		}
		if (!target) {
			emit(socket, 'console', 'Proper syntax for this command: /tour tier, size');
			return false;
		}
		var targets = splittyDiddles(target);
		var tierMatch = false;
		for (var i = 0; i < tourTierList.length; i++) {
			if ((targets[0]) == tourTierList[i]) {
			tierMatch = true;
			}
		}
		if (!tierMatch) {
			emit(socket, 'console', 'Please use one of the following tiers: ' + tourTierString);
			return false;
		}
		targets[1] = parseInt(targets[1]);
		if (isNaN(targets[1])) {
			emit(socket, 'console', 'Proper syntax for this command: /tour tier, size');
			return false;
		}
		if (targets[1] < 4) {
			emit(socket, 'console', 'Tournaments must contain 4 or more people.');
			return false;
		}
		
		tourTier = targets[0];
		tourSize = targets[1];
		tourSigyn = true;
		tourSignup = [];		
		
		room.addRaw('<h2><font color="green">' + sanitize(user.name) + ' has started a ' + tourTier + ' Tournament.</font> <font color="red">/j</font> <font color="green">to join!</font></h2><b><font color="blueviolet">PLAYERS:</font></b> ' + tourSize + '<br /><font color="blue"><b>TIER:</b></font> ' + tourTier + '<hr />');
		
		return false;
		break;
		
	case 'oriwinners':
		emit(socket, 'console', tourMoveOn + ' --- ' + tourBracket);
		return false;
		break;
		
	case 'toursize':
		if (!user.can('broadcast')) {
			emit(socket, 'console', 'You do not have enough authority to use this command.');
			return false;
		}
		if (!tourSigyn) {
			emit(socket, 'console', 'The tournament size cannot me changed now!');
			return false;
		}
		if (!target) {
			emit(socket, 'console', 'Proper syntax for this command: /toursize, size');
			return false;
		}
		target = parseInt(target);
		if (isNaN(target)) {
			emit(socket, 'console', 'Proper syntax for this command: /tour tier, size');
			return false;
		}
		if (target < 4) {
			emit(socket, 'console', 'A tournament must have at least 4 people in it.');
			return false;
		}
		if (target < tourSignup.length) {
			emit(socket, 'console', 'You can\'t boot people from a tournament like this.');
			return false;
		}
		tourSize = target;
		room.addRaw('<b>' + user.name + '</b> has changed the tournament size to: '+ tourSize +'. <b><i>' + (tourSize - tourSignup.length) + ' slots remaining.</b></i>');
		if(tourSize == tourSignup.length) {
			beginTour();
		}
		return false;
		break;
		
	case 'jointour':
	case 'jt':
	case 'j':
		if ((!tourSigyn) || tourActive) {
			emit(socket, 'console', 'There is already a tournament running, or there is not any tournament to join.');
			return false;
		}
		var tourGuy = user.userid;
		if (addToTour(tourGuy)) {
			room.addRaw('<b>' + user.name + '</b> has joined the tournament. <b><i>' + (tourSize - tourSignup.length) + ' slots remaining.</b></i>');
			if(tourSize == tourSignup.length) {
				beginTour();
			}
		} else {
			emit(socket, 'console', 'You could not enter the tournament.  You may already be in the tournament  Type /lt if you want to leave the tournament.');
		}
		return false;
		break;
	
	case 'leavetour':
	case 'lt':
		if ((!tourSigyn) && (!tourActive)) {
			emit(socket, 'console', 'There is no tournament to leave.');
			return false;
		}
		var spotRemover = false;
		if (tourSigyn) {
			for(var i=0;i<tourSignup.length;i++) {
				//emit(socket, 'console', tourSignup[1]);
				if (user.userid === tourSignup[i]) {
					tourSignup.splice(i,1);
					spotRemover = true;
					}
				}
			if (spotRemover) {
				room.addRaw('<b>' + user.name + '</b> has left the tournament. <b><i>' + (tourSize - tourSignup.length) + ' slots remaining.</b></i>');
			}
		} else if (tourActive) {
			var tourBrackCur;
			var tourDefWin;
			for(var i=0;i<tourBracket.length;i++) {
					tourBrackCur = tourBracket[i];
					if (tourBrackCur[0] == user.userid) {
						tourDefWin = Users.get(tourBrackCur[1]);
						if (tourDefWin) {
							spotRemover = true;
							tourDefWin.tourRole = 'winner';
							tourDefWin.tourOpp = '';
							user.tourRole = '';
							user.tourOpp = '';
						}
					}
					if (tourBrackCur[1] == user.userid) {
						tourDefWin = Users.get(tourBrackCur[0]);
						if (tourDefWin) {
							spotRemover = true;
							tourDefWin.tourRole = 'winner';
							tourDefWin.tourOpp = '';
							user.tourRole = '';
							user.tourOpp = '';
						}
					}
				}
			if (spotRemover) {
				room.addRaw('<b>' + user.name + '</b> has left the tournament. <b><i>');
			}

		}
		if (!spotRemover) {
			emit(socket, 'console', 'You cannot leave this tournament.  Either you did not enter the tournament, or your opponent is unavailable.');
			}
		return false;
		break;
			
	case 'forceleave':
	case 'fl':
	case 'flt':
		if (!user.can('broadcast')) {
			emit(socket, 'console', 'You do not have enough authority to use this command.');
			return false;
		}
		if (!tourSigyn) {
			emit(socket, 'console', 'There is no tournament in a sign-up phase.  Use /dq username if you wish to remove someone in an active tournament.');
			return false;
		}
		if (!target) {
			emit(socket, 'console', 'Please specify a user to kick from this signup.');
			return false;
		}
		var targetUser = Users.get(target);
		if (targetUser){
			target = targetUser.userid;
			}

		var spotRemover = false;

			for(var i=0;i<tourSignup.length;i++) {
				//emit(socket, 'console', tourSignup[1]);
				if (target === tourSignup[i]) {
					tourSignup.splice(i,1);
					spotRemover = true;
					}
				}
		if (spotRemover) {
				room.addRaw('The user <b>' + target + '</b> has left the tournament by force. <b><i>' + (tourSize - tourSignup.length) + ' slots remaining.</b></i>');
			} else {
				emit(socket, 'console', 'The user that you specified is not in the tournament.');
			}
		return false;
		break;
	
	case 'vr':
	case 'viewround':
	if (!user.can('broadcast')) {
			emit(socket, 'console', 'You do not have enough authority to use this command.');
			return false;
	}
	if (!tourActive) {
			emit(socket, 'console', 'There is no active tournament running.');
			return false;
	}
	if (tourRound == 1) {
		Rooms.lobby.addRaw('<hr /><h3><font color="green">The ' + tourTier + ' tournament has begun!</font></h3><font color="blue"><b>TIER:</b></font> ' + tourTier );
	} else {
		Rooms.lobby.addRaw('<hr /><h3><font color="green">Round '+ tourRound +'!</font></h3><font color="blue"><b>TIER:</b></font> ' + tourTier );
	}
	var tourBrackCur;
	for(var i = 0;i < tourBracket.length;i++) {
		tourBrackCur = tourBracket[i];
		if (!(tourBrackCur[0] === 'bye') && !(tourBrackCur[1] === 'bye')) {
			Rooms.lobby.addRaw(' - ' + getTourColor(tourBrackCur[0]) + ' VS ' + getTourColor(tourBrackCur[1]));
		} else if (tourBrackCur[0] === 'bye') {
			Rooms.lobby.addRaw(' - ' + tourBrackCur[1] + ' has recieved a bye!');
		} else if (tourBrackCur[1] === 'bye') {
			Rooms.lobby.addRaw(' - ' + tourBrackCur[0] + ' has recieved a bye!');
		} else {
			Rooms.lobby.addRaw(' - ' + tourBrackCur[0] + ' VS ' + tourBrackCur[1]);
		}
	}
	var tourfinalcheck = tourBracket[0];
	if ((tourBracket.length == 1) && (!(tourfinalcheck[0] === 'bye') || !(tourfinalcheck[1] === 'bye'))) {
		Rooms.lobby.addRaw('This match is the finals!  Good luck!');
	}
	Rooms.lobby.addRaw('<hr />');
	return false; 
	break;
	
	case 'remind':
		if (!user.can('broadcast')) {
			emit(socket, 'console', 'You do not have enough authority to use this command.');
			return false;
		}
		if (!tourSigyn) {
				emit(socket, 'console', 'There is no tournament to sign up for.');
				return false;
		}
		room.addRaw('<hr /><h2><font color="green">Please sign up for the ' + tourTier + ' Tournament.</font> <font color="red">/j</font> <font color="green">to join!</font></h2><b><font color="blueviolet">PLAYERS:</font></b> ' + tourSize + '<br /><font color="blue"><b>TIER:</b></font> ' + tourTier + '<hr />');
		return false;
		break;
		
	case 'replace':
	case 'tswitch':
	
		if (!user.can('broadcast')) {
			emit(socket, 'console', 'You do not have enough authority to use this command.');
			return false;
		}
		if (!tourActive) {
			emit(socket, 'console', 'The tournament is currently in a sign-up phase or is not active, and replacing users only works mid-tournament.');
			return false;
		}
		if (!target) {
			emit(socket, 'console', 'Proper syntax for this command is: /replace user1, user2.  User 2 will replace User 1 in the current tournament.');
			return false;
		}
		var targets = splittyDiddles(target);
		if (!targets[1]) {
			emit(socket, 'console', 'Proper syntax for this command is: /replace user1, user2.  User 2 will replace User 1 in the current tournament.');
			return false;
		}
		var userOne = Users.get(targets[0]); 
		var userTwo = Users.get(targets[1]);
		if (!userTwo) {
			emit(socket, 'console', 'Proper syntax for this command is: /replace user1, user2.  The user you specified to be placed in the tournament is not present!');
			return false;
		} else {
			targets[1] = userTwo.userid;
		}
		if (userOne) {
			targets[0] = userOne.userid;
		}
		var tourBrackCur = [];
		var replaceSuccess = false;
		//emit(socket, 'console', targets[0] + ' - ' + targets[1]);
		for (var i = 0; i < tourBracket.length; i++) {
			tourBrackCur = tourBracket[i];
			if (tourBrackCur[0] === targets[0]) {
				tourBrackCur[0] = targets[1];
				userTwo.tourRole = 'participant';
				userTwo.tourOpp = tourBrackCur[1];
				var oppGuy = Users.get(tourBrackCur[1]);
				if (oppGuy) {
					if (oppGuy.tourOpp === targets[0]) {
						oppGuy.tourOpp = targets[1];
						}
					}
				replaceSuccess = true;
				}
			if (tourBrackCur[1] === targets[0]) {
				tourBrackCur[1] = targets[1];
				userTwo.tourRole = 'participant';
				userTwo.tourOpp = tourBrackCur[0];
				var oppGuy = Users.get(tourBrackCur[0]);
				if (oppGuy) {
					if (oppGuy.tourOpp === targets[0]) {
						oppGuy.tourOpp = targets[1];
						}
					}
				replaceSuccess = true;
				}
			if (tourMoveOn[i] === targets[0]) {
				tourMoveOn[i] = targets[1];
				userTwo.tourRole = 'winner';
				userTwo.tourOpp = '';
			} else if (!(tourMoveOn[i] === '')) {
				userTwo.tourRole = '';
				userTwo.tourOpp = '';
			}
		}
		if (replaceSuccess) {
			room.addRaw('<b>' + targets[0] +'</b> has left the tournament and is replaced by <b>' + targets[1] + '</b>.');
			} else {
			emit(socket, 'console', 'The user you indicated is not in the tournament!');
			}
	return false;
	break;
	
	case 'endtour':
		if (!user.can('broadcast')) {
			emit(socket, 'console', 'You do not have enough authority to use this command.');
			return false;
		}
		tourActive = false;
		tourSigyn = false;
		tourBracket = [];
		tourSignup = [];
		tourTier = '';
		tourRound = 0;
		tourSize = 0;
		tourMoveOn = [];
		tourRoundSize = 0;
		room.addRaw('<h2><b>' + user.name + '</b> has ended the tournament.</h2>');
		return false;
		break;
	
	case 'dq':
	case 'disqualify':
		if (!user.can('broadcast')) {
			emit(socket, 'console', 'You do not have enough authority to use this command.');
			return false;
		}
		if (!target) {
			emit(socket, 'console', 'Proper syntax for this command is: /dq username');
			return false;
		}

		if (!tourActive) {
			emit(socket, 'console', 'There is no tournament running at this time!');
			return false;
		}
		var targetUser = Users.get(target);
		if (!targetUser) {
			var dqGuy = sanitize(target.toLowerCase());
			var tourBrackCur;
			var posCheck = false;
			for(var i = 0;i < tourBracket.length;i++) {
				tourBrackCur = tourBracket[i];
				if (tourBrackCur[0] === dqGuy) {
					var finalGuy = Users.get(tourBrackCur[1]);
					finalGuy.tourRole = 'winner';
					finalGuy.tourOpp = '';
					//targetUser.tourRole = '';
					posCheck = true;
					}
				if (tourBrackCur[1] === dqGuy) {
					var finalGuy = Users.get(tourBrackCur[0]);
					finalGuy.tourRole = 'winner';
					finalGuy.tourOpp = '';
					//targetUser.tourRole = '';
					posCheck = true;
					}
				}
			if (posCheck) {
				room.addRaw('<b>' + dqGuy + '</b> has been disqualified.');
			} else {
				emit(socket, 'console', 'That user was not in the tournament!');
			}
			return false;
		} else {
			var dqGuy = targetUser.userid;
			var tourBrackCur;
			var posCheck = false;
			for(var i = 0;i < tourBracket.length;i++) {
				tourBrackCur = tourBracket[i];
				if (tourBrackCur[0] === dqGuy) {
					var finalGuy = Users.get(tourBrackCur[1]);
					finalGuy.tourRole = 'winner';
					targetUser.tourRole = '';
					posCheck = true;
					}
				if (tourBrackCur[1] === dqGuy) {
					var finalGuy = Users.get(tourBrackCur[0]);
					finalGuy.tourRole = 'winner';
					targetUser.tourRole = '';
					posCheck = true;
					}
				}
			if (posCheck) {
				room.addRaw('<b>' + targetUser.name + '</b> has been disqualified.');
			} else {
				emit(socket, 'console', 'That user was not in the tournament!');
			}
			return false;
		}
		break;

	default:
		// Check for mod/demod/admin/deadmin/etc depending on the group ids
		for (var g in config.groups) {
			if (cmd === config.groups[g].id) {
				return parseCommand(user, 'promote', toUserid(target) + ',' + g, room, socket);
			} else if (cmd === 'de' + config.groups[g].id || cmd === 'un' + config.groups[g].id) {
				var nextGroup = config.groupsranking[config.groupsranking.indexOf(g) - 1];
				if (!nextGroup) nextGroup = config.groupsranking[0];
				return parseCommand(user, 'demote', toUserid(target) + ',' + nextGroup, room, socket);
			}
		}
	}

	if (message.substr(0,1) === '/' && cmd) {
		// To guard against command typos, we now emit an error message
		emit(socket, 'console', 'The command "/'+cmd+'" was unrecognized. To send a message starting with "/'+cmd+'", type "//'+cmd+'".');
		return false;
	}

	// chat moderation
	if (!canTalk(user, room, socket)) {
		return false;
	}

	// hardcoded low quality website
	if (/\bnimp\.org\b/i.test(message)) return false;

	// remove zalgo
	message = message.replace(/[\u0300-\u036f]{3,}/g,'');

	if (config.chatfilter) {
		return config.chatfilter(user, room, socket, message);
	}
	
	//check for tour winners
	if (tourActive) {
	checkForWins();
	}
	
	if (!room.battle) {
		motdcount = motdcount + 1;
		}
	if (motdcount >= motdfreq) {
		motdcount = 0;
		if (!(motd === "") && !room.battle) {
			room.addRaw('<div style="background-color:#DDDDDD;border:1px solid #6688AA;padding:2px 4px">' +
				'<b>Message of the Day: </b><br />' + motd + '</div>');
				}
		}

	return message;
}

/**
 * Can this user talk?
 * Pass the corresponding socket to give the user an error, if not
 */
function canTalk(user, room, socket) {
	if (!user.named) return false;
	if (user.locked) {
		if (socket) emit(socket, 'console', 'You are locked from talking in chat.');
		return false;
	}
	if (user.muted && room.id === 'lobby') {
		if (socket) emit(socket, 'console', 'You are muted and cannot talk in the lobby.');
		return false;
	}
	if (config.modchat && room.id === 'lobby') {
		if (config.modchat === 'crash') {
			if (!user.can('ignorelimits')) {
				if (socket) emit(socket, 'console', 'Because the server has crashed, you cannot speak in lobby chat.');
				return false;
			}
		} else {
			if (!user.authenticated && config.modchat === true) {
				if (socket) emit(socket, 'console', 'Because moderated chat is set, you must be registered to speak in lobby chat. To register, simply win a rated battle by clicking the look for battle button');
				return false;
			} else if (config.groupsranking.indexOf(user.group) < config.groupsranking.indexOf(config.modchat)) {
				var groupName = config.groups[config.modchat].name;
				if (!groupName) groupName = config.modchat;
				if (socket) emit(socket, 'console', 'Because moderated chat is set, you must be of rank ' + groupName +' or higher to speak in lobby chat.');
				return false;
			}
		}
	}
	return true;
}

function showOrBroadcastStart(user, cmd, room, socket, message) {
	if (cmd.substr(0,1) === '!') {
		if (!user.can('broadcast') || user.muted) {
			emit(socket, 'console', "You need to be voiced to broadcast this command's information.");
			emit(socket, 'console', "To see it for yourself, use: /"+message.substr(1));
		} else if (canTalk(user, room, socket)) {
			room.add('|c|'+user.getIdentity()+'|'+message);
		}
	}
}

function showOrBroadcast(user, cmd, room, socket, rawMessage) {
	if (cmd.substr(0,1) !== '!') {
		sendData(socket, '>'+room.id+'\n|raw|'+rawMessage);
	} else if (user.can('broadcast') && canTalk(user, room)) {
		room.addRaw(rawMessage);
	}
}

function getDataMessage(target) {
	var pokemon = Tools.getTemplate(target);
	var item = Tools.getItem(target);
	var move = Tools.getMove(target);
	var ability = Tools.getAbility(target);
	var atLeastOne = false;
	var response = [];
	if (pokemon.exists) {
		response.push('|c|~|/data-pokemon '+pokemon.name);
		atLeastOne = true;
	}
	if (ability.exists) {
		response.push('|c|~|/data-ability '+ability.name);
		atLeastOne = true;
	}
	if (item.exists) {
		response.push('|c|~|/data-item '+item.name);
		atLeastOne = true;
	}
	if (move.exists) {
		response.push('|c|~|/data-move '+move.name);
		atLeastOne = true;
	}
	if (!atLeastOne) {
		response.push("||No pokemon, item, move, or ability named '"+target+"' was found. (Check your spelling?)");
	}
	return response;
}

function splitTarget(target, exactName) {
	var commaIndex = target.indexOf(',');
	if (commaIndex < 0) {
		return [Users.get(target, exactName), '', target];
	}
	var targetUser = Users.get(target.substr(0, commaIndex), exactName);
	if (!targetUser) {
		targetUser = null;
	}
	return [targetUser, target.substr(commaIndex+1).trim(), target.substr(0, commaIndex)];
}

function logModCommand(room, result, noBroadcast) {
	if (!noBroadcast) room.add(result);
	modlog.write('['+(new Date().toJSON())+'] ('+room.id+') '+result+'\n');
}

parseCommandLocal.uncacheTree = function(root) {
	var uncache = [require.resolve(root)];
	do {
		var newuncache = [];
		for (var i = 0; i < uncache.length; ++i) {
			if (require.cache[uncache[i]]) {
				newuncache.push.apply(newuncache,
					require.cache[uncache[i]].children.map(function(module) {
						return module.filename;
					})
				);
				delete require.cache[uncache[i]];
			}
		}
		uncache = newuncache;
	} while (uncache.length > 0);
};

// This function uses synchronous IO in order to keep it relatively simple.
// The function takes about 0.023 seconds to run on one tested computer,
// which is acceptable considering how long the server takes to start up
// anyway (several seconds).
parseCommandLocal.computeServerVersion = function() {
	/**
	 * `filelist.txt` is a list of all the files in this project. It is used
	 * for computing a checksum of the project for the /version command. This
	 * information cannot be determined at runtime because the user may not be
	 * using a git repository (for example, the user may have downloaded an
	 * archive of the files).
	 *
	 * `filelist.txt` is generated by running `git ls-files > filelist.txt`.
	 */
	var filenames;
	try {
		var data = fs.readFileSync('filelist.txt', {encoding: 'utf8'});
		filenames = data.split('\n');
	} catch (e) {
		return 0;
	}
	var hash = crypto.createHash('md5');
	for (var i = 0; i < filenames.length; ++i) {
		try {
			hash.update(fs.readFileSync(filenames[i]));
		} catch (e) {}
	}
	return hash.digest('hex');
};

/*
And here is the new home for my custom functions and tournament functions.  How fun!
*/

//misc functions
function splittyDoodles(target) {
	
	var cmdArr =  target.split(",");
	for(var i = 0; i < cmdArr.length; i++) {
		cmdArr[i] = cmdArr[i].trim();
	}
	var guy = Users.get(cmdArr[0]);
	if (!guy || !guy.connected) {
		cmdArr[0] = null;
	}
	return cmdArr;
}


function splittyDiddles(target) {
	
	var cmdArr =  target.split(",");
	for(var i = 0; i < cmdArr.length; i++) {
		cmdArr[i] = cmdArr[i].trim();
	}
	return cmdArr;
}

function stripBrackets(target) {
	
	var cmdArr =  target.split("<");
	for(var i = 0; i < cmdArr.length; i++) {
		cmdArr[i] = cmdArr[i].trim();
	}
	return cmdArr[0];
}

function stripBrackets2(target) {
	
	var cmdArr =  target.split(">");
	for(var i = 0; i < cmdArr.length; i++) {
		cmdArr[i] = cmdArr[i].trim();
	}
	return cmdArr[0];
}

function noHTMLforyou(target) {

	var htmlcheck = false;
	var text = target;
	for(var i = 0; i < text.length; i++) {
		if ((text.charAt(i) === '<') || (text.charAt(i) === '>')) {
			htmlcheck = true;
			}
		}
	return htmlcheck;
}

//tour functions
//tournament functions

function addToTour(tourGuyId) {

var alreadyExistsTour = false;

for( var i=0; i < tourSignup.length; i++) {
	if(tourGuyId === tourSignup[i]) {
		alreadyExistsTour = true;
		}
}
if (alreadyExistsTour) return false;

var tourUserOb = Users.get(tourGuyId);

if (!tourUserOb) return false;

tourSignup.push(tourGuyId);
tourUserOb.tourRole = 'participant';
return true;

}

//shuffles list in-place
function shuffle(list) {
  var i, j, t;
  for (i = 1; i < list.length; i++) {
    j = Math.floor(Math.random()*(1+i));  // choose j in [0..i]
    if (j != i) {
      t = list[i];                        // swap list[i] and list[j]
      list[i] = list[j];
      list[j] = t;
    }
  }
  return list;
}


function beginTour() {
if(tourSignup.length > tourSize) {
	return false;
	} else {
	tourRound = 0;
	tourSigyn = false;
	tourActive = true;
	beginRound();
	return true;
		}
}

function checkForWins() {
	
	var p1win = '';
	var p2win = '';
	var tourBrackCur = [];
	
	for(var i = 0;i < tourBracket.length;i++) {
		tourBrackCur = tourBracket[i];
		p1win = Users.get(tourBrackCur[0]);
		p2win = Users.get(tourBrackCur[1]);
		if (tourMoveOn[i] == '') {


			if (tourBrackCur[0] === 'bye') {
				p2win.tourRole = '';
				tourMoveOn[i] = tourBrackCur[1];
				Rooms.lobby.addRaw(' - <b>' + tourBrackCur[1] + '</b> has recieved a bye and will move on to the next round!');
			}
			if (tourBrackCur[1] === 'bye') {
				p1win.tourRole = '';
				tourMoveOn[i] = tourBrackCur[0];
				Rooms.lobby.addRaw(' - <b>' + tourBrackCur[0] + '</b> has recieved a bye and will move on to the next round!');
			}
			if ((!p1win) && (tourMoveOn.length == 1)) {
				p2win.tourRole = '';
				tourMoveOn[i] = tourBrackCur[1];
				Rooms.lobby.addRaw(' - <b>' + tourBrackCur[1] + '</b> has recieved a bye and will move on to the next round!');
				finishTour(tourBrackCur[1],'dud');
			}
			if ((!p2win) && (tourMoveOn.length == 1)) {
				p1win.tourRole = '';
				tourMoveOn[i] = tourBrackCur[0];
				Rooms.lobby.addRaw(' - <b>' + tourBrackCur[0] + '</b> has recieved a bye and will move on to the next round!');
				finishTour(tourBrackCur[0],'dud');
			}
			if (!p1win) {
				p2win.tourRole = '';
				tourMoveOn[i] = tourBrackCur[1];
				Rooms.lobby.addRaw(' - <b>' + tourBrackCur[1] + '</b> has recieved a bye and will move on to the next round!');
			}
			if (!p2win) {
				p1win.tourRole = '';
				tourMoveOn[i] = tourBrackCur[0];
				Rooms.lobby.addRaw(' - <b>' + tourBrackCur[0] + '</b> has recieved a bye and will move on to the next round!');
			}
			if ((p1win.tourRole === 'winner') && (tourMoveOn.length == 1)) {
				p1win.tourRole = '';
				tourMoveOn[i] = tourBrackCur[0];
				Rooms.lobby.addRaw(' - <b>' + tourBrackCur[0] + '</b> has beat ' + tourBrackCur[1] + '!');
				finishTour(tourBrackCur[0],tourBrackCur[1]);
			} else if ((p2win.tourRole === 'winner') && (tourMoveOn.length == 1)) {
				p2win.tourRole = '';
				tourMoveOn[i] = tourBrackCur[1];
				Rooms.lobby.addRaw(' - <b>' + tourBrackCur[1] + '</b> has beat ' + tourBrackCur[0] + '!');
				finishTour(tourBrackCur[1],tourBrackCur[0]);
			}
			
			if (p1win.tourRole === 'winner') {
				p1win.tourRole = '';
				tourMoveOn[i] = tourBrackCur[0];
				Rooms.lobby.addRaw(' - <b>' + tourBrackCur[0] + '</b> has beat ' + tourBrackCur[1] + ' and will move on to the next round!');

			} else if (p2win.tourRole === 'winner') {
				p2win.tourRole = '';
				tourMoveOn[i] = tourBrackCur[1];
				Rooms.lobby.addRaw(' - <b>' + tourBrackCur[1] + '</b> has beat ' + tourBrackCur[0] + ' and will move on to the next round!');
			}
		}
	}

	var moveOnCheck = true;
	for (var i = 0;i < tourRoundSize;i++) {
		if (tourMoveOn[i] === '') {
			moveOnCheck = false;
			}
	}
	if (!tourActive) {
	return;
	}
	if (moveOnCheck) {
	
		tourSignup = [];
		for (var i = 0;i < tourRoundSize;i++) {
			if (!(tourMoveOn[i] === 'bye')) {
				tourSignup.push(tourMoveOn[i]);
				}
		}

		tourSignup = tourMoveOn;
		beginRound();
	}
}
		
function beginRound() {
	for(var i = 0;i < tourSignup.length;i++) {
		var participantSetter = Users.get(tourSignup[i]);
		if (!participantSetter) {
				tourSignup[i] = 'bye';
			} else {
				participantSetter.tourRole = 'participant';
			}
		}
	tourBracket = [];
	var sList = tourSignup;
	shuffle(sList);
	do
		{
		if (sList.length == 1) {
			tourBracket.push([sList.pop(),'bye']);
		} else if (sList.length > 1) {
			tourBracket.push([sList.pop(),sList.pop()]);
			}
		}
	while (sList.length > 0);
	tourRound++;
	tourRoundSize = tourBracket.length;
	//poopycakes
	tourMoveOn = [];
	for (var i = 0;i < tourRoundSize;i++) {
	tourMoveOn.push('');
	}
	
	if (tourRound == 1) {
		Rooms.lobby.addRaw('<hr /><h3><font color="green">The ' + tourTier + ' tournament has begun!</font></h3><font color="blue"><b>TIER:</b></font> ' + tourTier );
	} else {
		Rooms.lobby.addRaw('<hr /><h3><font color="green">Round '+ tourRound +'!</font></h3><font color="blue"><b>TIER:</b></font> ' + tourTier );
	}
	var tourBrackCur;
	var p1OppSet;
	var p2OppSet;
	for(var i = 0;i < tourBracket.length;i++) {
		tourBrackCur = tourBracket[i];
		if (!(tourBrackCur[0] === 'bye') && !(tourBrackCur[1] === 'bye')) {
			Rooms.lobby.addRaw(' - ' + tourBrackCur[0] + ' VS ' + tourBrackCur[1]);
			p1OppSet = Users.get(tourBrackCur[0]);
			p1OppSet.tourOpp = tourBrackCur[1];
			p2OppSet = Users.get(tourBrackCur[1]);
			p2OppSet.tourOpp = tourBrackCur[0];
		} else if (tourBrackCur[0] === 'bye') {
			Rooms.lobby.addRaw(' - ' + tourBrackCur[1] + ' has recieved a bye!');
			var autoWin = Users.get(tourBrackCur[1]);
			autoWin.tourRole = '';
			tourMoveOn[i] = tourBrackCur[0];
		} else if (tourBrackCur[1] === 'bye') {
			Rooms.lobby.addRaw(' - ' + tourBrackCur[0] + ' has recieved a bye!');
			var autoWin = Users.get(tourBrackCur[0]);
			autoWin.tourRole = '';
			tourMoveOn[i] = tourBrackCur[0];
		} else {
			Rooms.lobby.addRaw(' - ' + tourBrackCur[0] + ' VS ' + tourBrackCur[1]);
		}
	}
	var tourfinalcheck = tourBracket[0];
	if ((tourBracket.length == 1) && (!(tourfinalcheck[0] === 'bye') || !(tourfinalcheck[1] === 'bye'))) {
		Rooms.lobby.addRaw('This match is the finals!  Good luck!');
	}
	Rooms.lobby.addRaw('<hr />');

	return true;
}

function finishTour(first,second) {
		var winnerUser = Users.get(first);
		var winnerName = winnerUser.name;
		if (second === 'dud') {
				var secondName = 'n/a';
			} else {
				var secondUser = Users.get(second);
				var secondName = secondUser.name;
		}

		
		Rooms.lobby.addRaw('<h2><font color="green">Congratulations <font color="black">' + winnerName + '</font>!  You have won the ' + tourTier + ' Tournament!</font></h2><br><font color="blue"><b>SECOND PLACE:</b></font> ' + secondName + '<br><hr />');
		
		tourActive = false;
		tourSigyn = false;
		tourBracket = [];
		tourSignup = [];
		tourTier = '';
		tourRound = 0;
		tourSize = 0;
		tourMoveOn = [];
		tourRoundSize = 0;
		return true;
}

function getTourColor(target) {
	var colorGuy = -1;
	var tourGuy;
	for(var i=0;i<tourBracket.length;i++) {
		tourGuy = tourBracket[i];
		if ((tourGuy[0] === target) || (tourGuy[1] === target)) {
			colorGuy = i;	
		}
	}
	if (colorGuy == -1) {
	return target;
	}
	if (tourMoveOn[colorGuy] == '') {
	return '<b>'+target+'</b>';
	} else if (tourMoveOn[colorGuy] === target) {
	return '<b><font color="green">'+target+'</font></b>';
	} else {
	return '<b><font color="red">'+target+'</font></b>';
	}
}



parseCommandLocal.serverVersion = parseCommandLocal.computeServerVersion();

exports.parseCommand = parseCommandLocal;
