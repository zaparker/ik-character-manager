function CharacterViewModel(model) {
    var self = this;
    self.availableArchetypes = ko.observableArray([]);
    self.availableRaces = ko.observableArray([]);
    self.availableSkills = ko.observableArray([]);
    self.availableCareers = ko.observableArray([]);
    self.availableAbilities = ko.observableArray([]);
    self.availableMilitarySkills = ko.computed(function() {
        return $.grep(self.availableSkills(), function(skill) { return skill.type == 'military' && !self.hasSkill(skill); });
    });
    self.availableOccupationalSkills = ko.computed(function() {
        return $.grep(self.availableSkills(), function(skill) { return skill.type == 'occupational' && !self.hasSkill(skill); });
    });
    self.availableMeleeWeapons = ko.observableArray([]);
    self.availableRangedWeapons = ko.observableArray([]);
    self.model = ko.mapping.fromJS(model, {
        armor: { create: function(options) { return ko.observable(options.data); } },
        race: { create: function(options) { return ko.observable(options.data); } },
        skills: {
            create: function(options) {
                var vm = ko.mapping.fromJS(options.data, { observe: ['level'] });
                return vm;
            }
        },
        meleeWeapons: {
            create: function(options) {
                var vm = ko.mapping.fromJS(options.data, { observe: ['specialQualities'] });
                return vm;
            }
        },
        rangedWeapons: {
            create: function(options) {
                var vm = ko.mapping.fromJS(options.data, { observe: ['specialQualities'] });
                return vm;
            }
        }
    });
    self.model.stats.willpower = ko.computed(function() {
        return self.model.stats.phy() + self.model.stats.int();
    });
    self.model.def = ko.computed(function() {
        var def = parseInt(self.model.stats.spd()) + parseInt(self.model.stats.agl()) + parseInt(self.model.stats.per());

        if(self.model.race() && self.model.race().defModifier)
            def += self.model.race().defModifier;
        if(self.model.armor && self.model.armor)
            def += self.model.armor().defPenalty;

        return def;
    });
    self.model.arm = ko.computed(function() {
        var arm = parseInt(self.model.stats.phy());
        if(self.model.armor && self.model.armor())
            arm += self.model.armor().armor;
        return arm;
    });
    self.model.initiative = ko.computed(function() {
        return parseInt(self.model.stats.spd()) + parseInt(self.model.stats.prw()) + parseInt(self.model.stats.per());
    });
    self.model.rangedWeaponsWithSpecial = ko.computed(function() {
        return $.grep(self.model.rangedWeapons(), function(w) { return w.specialQualities().length > 0; });
    });
    self.model.meleeWeaponsWithSpecial = ko.computed(function() {
        return $.grep(self.model.meleeWeapons(), function(w) { return w.specialQualities().length > 0; });
    });
    self.model.militarySkills = ko.computed(function() {
        return $.grep(self.model.skills(), function(skill) { return skill.type == 'military'; });
    });
    self.model.occupationalSkills = ko.computed(function() {
        return $.grep(self.model.skills(), function(skill) { return skill.type == 'occupational'; });
    });
    self.combinedAvailableAbilities = ko.computed(function() {
        var abilities = [];
        for(var i = 0; i < self.model.careers().length; ++i) {
            var career = self.model.careers()[i];
            for(var j = 0; j < career.availableAbilities.length; ++j) {
                var ability = career.availableAbilities[j];
                if(abilities.indexOf(ability) == -1)
                    abilities.push(ability);
            }
        }
        return $.map(abilities, function(ability) { return $.grep(self.availableAbilities(), function(abl) {return abl.name == ability;})[0]; });
    });
    self.addCareer = function(career) {
        self.model.careers.push(career);
    };
    self.removeCareer = function(career) {
        self.model.careers.remove(career);
    };
    self.addAbility = function(ability) {
        self.model.abilities.push(ability);
    };
    self.removeAbility = function(ability) {
        self.model.abilities.remove(ability);
    };
    self.getSkillLevel = function(skillName) {
        var level = 0;
        $.each(self.model.skills(), function(i, skill) {
            if(skill.name == skillName) {
                level = parseInt(skill.level()) + parseInt(self.model.stats[skill.stat]());
                return false;
            }
        });
        return level;
    }
    self.hasSkill = function(skill) {
        return $.grep(self.model.skills(), function(s) { return s.name == skill.name; }).length > 0;
    }
    self.addSkill = function(skill) {
        var vm = { name: skill.name, stat: skill.stat, level: ko.observable(1) };
        self.model.skills.push(vm);
    };
    self.removeSkill = function(skill) {
        self.model.skills.remove(skill);
    };
    self.addMeleeWeapon = function(weapon) {
        var vm = ko.mapping.fromJS(weapon, { observe: ['specialQualities'] });
        self.model.meleeWeapons.push(vm);
    };
    self.removeMeleeWeapon = function(weapon) {
        self.model.meleeWeapons.remove(weapon);
    };
    self.addRangedWeapon = function(weapon) {
        var vm = ko.mapping.fromJS(weapon, { observe: ['specialQualities'] });
        self.model.rangedWeapons.push(vm);
    };
    self.removeRangedWeapon = function(weapon) {
        self.model.rangedWeapons.remove(weapon);
    };
    self.output = function() {
        var modelString = JSON.stringify(ko.mapping.toJS(self.model));
        alert(modelString);
    }
    /*
     $.get('./skills.json', function(skills) {
     self.availableSkills(skills);
     });
     $.get('./meleeWeapons.json', function(skills) {
     self.availableSkills(skills);
     });
     $.get('./rangedWeapons.json', function(skills) {
     self.availableSkills(skills);
     });
     */

    $.ajax({url: "abilities.json", type: "GET", async: false, contentType: "application/json", success: function(result){ self.availableAbilities(result); }});

    $.ajax({url: "races.json", type: "GET", async: false, contentType: "application/json", success: function(result){ self.availableRaces(result); }});

    self.availableSkills([
        {
            name: 'Detection',
            stat: 'agl',
            type: 'occupational'
        },
        {
            name: 'Rifle',
            stat: 'poi',
            type: 'military'
        },
        {
            name: 'Hand Weapon',
            stat: 'prw',
            type: 'military'
        },
        {
            name: 'Great Weapon',
            stat: 'prw',
            type: 'military'
        }
    ]);
    self.availableCareers();
    self.availableRangedWeapons([
        {
            name: 'Rifle',
            skill: 'Rifle',
            range: 8,
            pow: 10,
            attackModifier: 0,
            specialQualities: []
        },
        {
            name: 'Scattergun',
            skill: 'Rifle',
            range: 'SP 8',
            pow: 11,
            attackModifier: -2,
            specialQualities: []
        }
    ]);
    self.availableMeleeWeapons([
        {
            name: 'Sword',
            skill: 'Hand Weapon',
            pow: 3,
            attackModifier: 0,
            specialQualities: []
        },
        {
            name: 'Spear',
            skill: 'Great Weapon',
            pow: 3,
            attackModifier: 0,
            specialQualities: [
                { name: 'Reach', description: '' },
                { name: 'Set Defense', description: 'Enemy models suffer -2 to charge attack and power attack rolls against this model if the attacker is in the front arc of this model' }
            ]
        }
    ]);

}