    exports.BattleMovedex = {    
        "waterpulse": {
              	inherit: true,
                basePower: 80
    	},
        "paleowave": {
              	inherit: true,
        	isNonstandard: false
    	},
        "submission": {
              	inherit: true,
                accuracy: 100,
                basePower: 120,
                category: "Physical",
                secondary: {
                        chance: 10,
                        volatileStatus: 'flinch'
        	}
    	},
    	"shadowpunch": {
    		inherit: true,
    		basePower: 90
    	},
    	"twineedle": {
		num: 41,
		accuracy: 100,
		basePower: 40,
		category: "Physical",
		desc: "Deals damage to one adjacent target and hits twice, with each hit having a 20% chance to poison it. If the first hit breaks the target's Substitute, it will take damage for the second hit.",
		shortDesc: "Hits 2 times. Each hit has 20% chance to poison.",
		id: "twineedle",
		name: "Twineedle",
		pp: 20,
		priority: 0,
		multihit: [2,2],
		secondary: {
			chance: 20,
			status: 'psn'
		},
		target: "normal",
		type: "Bug"
	},
      	"lunardance": {
		num: 461,
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user faints and the Pokemon brought out to replace it has its HP and PP fully restored along with having any major status condition cured. Fails if the user is the last unfainted Pokemon in its party.",
		shortDesc: "User faints. Replacement is fully healed, with PP.",
		id: "lunardance",
		isViable: true,
		name: "Lunar Dance",
		pp: 20,
		priority: 0,
		isSnatchable: true,
		boosts: {
			spa: 1,
			spe: 1
		},
		target: "self",
		type: "Psychic"
	}, 
        "airslash": {
              	inherit: true,
                basePower: 90
    	},
    	"psyshock": {
	      	inherit: true,
		basePower: 90
	},
	"icywind": {
	      	inherit: true,
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		defensiveCategory: "Special",
		desc: "Physical But Deals Special Damage.",
		shortDesc: "Physical but hits on Special Defense.",
		secondary: false
	}
};  
