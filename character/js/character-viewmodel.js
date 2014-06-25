function CharacterViewModel(model) {
          var self = this;
          function CharacterMeleeWeaponViewModel(weaponModel) {
            var vm = ko.mapping.fromJS(weaponModel, { observe: ['specialQualities'] });
            vm.attack = ko.computed(function() {
              var total = parseInt(self.getSkillLevel(vm.skill));
              if(vm.attackModifier > 0 || !self.hasAbility('Specialization (' + vm.name + ')')) {
                total += vm.attackModifier;
              }
              return total;
            }, this, { deferEvaluation: true });
            vm.pPlusS = ko.computed(function() {
              return vm.pow + parseInt(self.model.stats.str());
            }, this, { deferEvaluation: true });
            return vm;
          }
          function CharacterRangedWeaponViewModel(weaponModel) {
            var vm = ko.mapping.fromJS(weaponModel, { observe: ['specialQualities'] });
            vm.attack = ko.computed(function() {
              var total = parseInt(self.getSkillLevel(vm.skill));
              if(vm.attackModifier > 0 || !self.hasAbility('Specialization (' + vm.name + ')')) {
                total += vm.attackModifier;
              }
              return total;
            }, this, { deferEvaluation: true });
            return vm;
          }
          function CharacterSkillViewModel(skillModel) {
            var vm = ko.mapping.fromJS(skillModel, { observe: ['level'] });
            vm.nameWithStat = ko.computed(function() { return vm.name + ' (' + vm.stat.toUpperCase() + ')'; });
            vm.statValue = ko.computed(function(){
              return parseInt(self.model.stats[vm.stat]());
            }, this, { deferEvaluation: true });
            vm.total = ko.computed(function(){
              return vm.statValue() + parseInt(vm.level());
            }, this, { deferEvaluation: true });
            return vm;
          }
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
                return new CharacterSkillViewModel(options.data);
              } 
            },
            meleeWeapons: { 
              create: function(options) { 
                return new CharacterMeleeWeaponViewModel(options.data);
              } 
            },
            rangedWeapons: { 
              create: function(options) { 
                return new CharacterRangedWeaponViewModel(options.data);
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
            var result = parseInt(self.model.stats.spd()) + parseInt(self.model.stats.prw()) + parseInt(self.model.stats.per());
            result += self.hasAbility('Fast Draw') ? 2 : 0;
            return result;
          }, this, { deferEvaluation: true });
          self.model.commandRange = ko.computed(function() {
            var result = self.getSkillLevel('Command');
            result += self.hasAbility('Natural Leader') ? 2 : 0;
            return result;
          }, this, { deferEvaluation: true });
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
          self.model.listedAbilities = ko.computed(function() {
            return $.grep(self.model.abilities(), function(a) { return a.showInList; });
          });
          self.combinedAvailableAbilities = ko.computed(function() {
            var abilities = [];
            for(var i = 0; i < self.model.careers().length; ++i) {
              var career = self.model.careers()[i];
              for(var j = 0; j < career.availableAbilities.length; ++j) {
                var ability = career.availableAbilities[j];
                if(abilities.indexOf(ability) == -1 && !self.hasAbility(ability))
                  abilities.push(ability);
              }
            }
            abilities = $.map(abilities, function(ability) { return $.grep(self.availableAbilities(), function(abl) {return abl.name == ability;})[0]; });
            abilities.sort(function(a, b) {
              if (a.name < b.name)
                return -1;
              if (a.name > b.name)
                return 1;
              return 0;
            });
            return abilities;
          });
          self.getSkillLevel = function(skillName) {
            var level = 0;
            $.each(self.model.skills(), function(i, skill) {
              if(skill.name == skillName) {
                level += parseInt(skill.level());
                return false;
              }
            });
            $.each(self.availableSkills(), function(i, skill) {
              if(skill.name == skillName) {
                level += parseInt(self.model.stats[skill.stat]());
                return false;
              }
            });
            return level;
          };
          self.hasAbility = function(abilityName) {
            return $.grep(self.model.abilities(), function(a) { return a.name == abilityName; }).length > 0;
          }
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
          self.hasSkill = function(skill) {
            return $.grep(self.model.skills(), function(s) { return s.name == skill.name; }).length > 0;
          };
          self.addSkill = function(skill) {
              var vm = new CharacterSkillViewModel({ name: skill.name, stat: skill.stat, level: 1, type: skill.type });
              self.model.skills.push(vm);
          };
          self.removeSkill = function(skill) {
            self.model.skills.remove(skill);
          };
          self.addMeleeWeapon = function(weapon) {
              var vm = new CharacterMeleeWeaponViewModel(weapon);
              self.model.meleeWeapons.push(vm);
          };
          self.removeMeleeWeapon = function(weapon) {
            self.model.meleeWeapons.remove(weapon);
          };
          self.addRangedWeapon = function(weapon) {
              var vm = new CharacterRangedWeaponViewModel(weapon);
              self.model.rangedWeapons.push(vm);
          };
          self.removeRangedWeapon = function(weapon) {
            self.model.rangedWeapons.remove(weapon);
          };
          self.output = function() {
            var modelString = JSON.stringify(ko.mapping.toJS(self.model));
            alert(modelString);
          }
          self.availableArchetypeBenefits = ko.computed(function() {
            var results = [];
            return results;
          });
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
          self.availableAbilities([
            {
              name: "Ambush",
              description: 'During the first round of an encounter, this character gains boosted attack and damage rolls against enemies that have not activated that encounter.',
              showInList: true
            },
            {
              name: 'Appraise',
              description: 'The character has a sharp eye and keen mind for detail, especially where monetary values are concerned. The character can judge the value of most fine goods with an inspection. Truly good fakes might require a Detection + INT roll to spot.',
              showInList: true
            },
            {
              name: 'Arcane Precision',
              requiredSkill: { name: 'Detection', level: 3 },
              description: 'When this character forfeits his movement to aim with a ranged weapon, he ignores stealth that turn.',
              showInList: true
            },
            {
              name: 'Binding',
              requiredSkill: { name: 'Rope Use', level: 1 },
              description: 'When the character ties up, manacles, or otherwise restrains another character with some form of restraints, add +3 to the skill roll difficulty for the bound character to escape.',
              showInList: true
            },
            {
              name: 'Bomber',
              requiredSkill: { name: 'Thrown Weapon', level: 3 },
              description: "When this character's grenade ranged attack deviates, you can reroll the direction and/or distance of deviation. A roll can only be rerolled once as a result of Bomber.",
              showInList: true
            },
            {
              name: 'Brew Master',
              requiredSkill: { name: 'Alchemy', level: 2 },
              description: 'The character can reroll failed Alchemy rolls. Each failed roll can be rerolled only once as a result of Brew Master.',
              showInList: true
            },
            {
              name: 'Craft Rune Shot',
              description: "The character can craft his own rune shot amnrunition. Instead of paying 5 gc for each metal cartridge round of rune shot ammunition, a charactcr with this ability and a rune shot casting kit can cast his own rounds, paying 1 gc for the powder, material to cast a rune bullet, and metal casing to press one round of rune shot ammunition. The character must inscribe the casing and bullet bv hand. A character can craft up to five rune shot cartridges in an hour."
            },
            {
              name: 'Expert Rider',
              requiredSkill: { name: 'Riding', level: 2 },
              description: "The character can reroIl failed Riding rolls. Each roll can be rerolled only once as a result of Expert Rider. Additionally, provided the mount has not been knocked out, this character and his mount cannot be knocked down while this character is mounted."
            },
            {
              name: 'Fast Cook',
              requiredSkill: { name: 'Alchemy', level: 2 },
              description: 'The character has learned a number of time-saving shortcuts in the art of brewing potions and mixing alchemical substances. He can create alchemical items in half the normal time.',
              showInList: true
            },
            {
              name: 'Fast Draw',
              description: "A character with this skill gains +2 on initiative rolls. He also gains an additional quick action during his first turn of combat each encounter that can be used only to draw a weapon."
            },
            {
              name: 'Fast Reload',
              description: "The character gains one extra quick action each turn that can be used only to reload a ranged weapon."
            },
            {
              name: 'Field Alchemist',
              requiredSkill: { name: 'Alchemy', level: 1 },
              description: 'The character gains an additional quick action each turn that can be used only to create a field alchemy quick effect.',
              showInList: true
            },
            {
              name: 'Fire in the Hole!',
              requiredSkill: { name: 'Thrown Weapon', level: 1 },
              description: "This character can make a grenade attack at the start of the Action Phase of his turn before moving or making his normal attacks. A character making a Fire in the Hole! attack must use his novement that turn to run or make a full advance.",
              showInList: true
            },
            {
              name: 'Free Style',
              requiredSkill: { name: 'Alchemy', level: 1 },
              description: "The character can improvise the ingredients in his alchcmical compounds. This allows the character to attempt to make do without a specific ingredient. This requiles an Alchemy skill with a target number equal to 10 plus the gc value of the ingredient. This ability also allows the character to get by with less expensive versions of common alchemical ingredients, reducing the cost of his alchemical compounds by 1 gc each (to a minimum of 1 gc). Alchemical compounds brewed using this skill vary slightly in appearance or physical quality from items created by following time-tested recipes.",
              showInList: true
            },
            {
              name: 'Grenadier',
              requiredSkill: { name: 'Thrown Weapon', level: 1 },
              description: "The character gains an additional quick action each turn that can be nsed onlv to pull the pin on a grenade.",
              showInList: true
            },
            {
              name: "Gunfighter",
              description: "The character does not suffer a -4 penalty on ranged attack rolls with pistols or carbines while engaged."
            },
            {
              name: 'Keen Eyed',
              description: 'The character can increase his effective range with a bow or rifle by feet (2") and his extreme range by sixty feet (10").'
            },
            {
              name: "Light Cavalry",
              requiredSkill: { name: 'Riding', level: 2 },
              description: 'If this character is riding a mount not designated as a warhorse, at the end of his turn he can advance up to 5".'
            },
            {
              name: 'Natural Leader',
              requiredSkill: { name: 'Command', level: 1 },
              description: 'A character with Natural Leader has their command range extended by 2".',
              showInList: false
            },
            {
              name: 'Poison Resistance',
              description: "The character gains boosted rolls to resist poisons and toxins.",
              showInList: true
            },
            {
              name: "Prowl",
              requiredSkill: { name: 'Sneak', level: 1 },
              description: "The character is virtually invisible while in the shadows or in terrain that grants a degree of concealment. The character gains stealth (p.220) while within terrain that provides concealment, the AOE of a spell that provides concealment, or the AOE of a cloud effect."
            },
            {
              name: "Ride-By Attack",
              requiredSkill: { name: 'Riding', level: 2 },
              description: "While mounted, this character can combine his movement and action during his turn to make a Ride-By Attack. The character declares a Ride-By Attack at the start of his Activation Phase. He makes a full advance and can halt his movement at any point to make his attacks. After his attacks, he resumes his movement."
            },
            {
              name: "Saddle Shot",
              requiredSkill: { name: 'Riding', level: 1 },
              description: "This character does not suffer the firing from horseback penalty when making ranged attacks while mounted (see p. 214)."
            },
            {
              name: "Swift Hunter",
              requiredStat: { name: 'agl', value: 6 },
              description: 'When this character incapacitates an enemy by using a normal ranged attack, immediately after the attack is resolved he can advance up to twelve feet (2").'
            },
            {
              name: 'Swift Rider',
              description: 'While riding a mount, the character can move over rough terrain without penalty.'
            },
            {
              name: "Traceless Path",
              requiredSkill: { name: 'Sneak', level: 2 },
              description: 'The character knows how to conceal his trail when moving over land. Though he can move at one half his usual rate of speed while using this ability, either on foot or horseback, anyone attempting to follow his trail has +3 added to his skill roll target number.'
            },
            {
              name: "Two-Weapon Fighting",
              requiredStat: { name: 'agl', value: 4 },
              description: 'While fighting with a one-handed weapon or pistol in each hand, the character gains an additional attack for the second weapon. He suffers -2 on attacks rolls with the second weapon while doing so.'
            },
            {
              name: 'Waylay',
              description: 'When an attack made by this character has the chance to knock out a target, increase the target number for the Willpower roll to resist the knockout by 2.'
            }
          ]);
          self.availableSkills([
            {
              name: 'Detection',
              stat: 'agl',
              type: 'occupational'
            },
            {
              name: 'Command',
              stat: 'int',
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
          self.availableCareers([
            {
              name: 'Alchemist',
              availableAbilities: [
                'Bomber',
                'Brew Master',
                'Fast Cook',
                'Field Alchemist',
                'Fire in the Hole!',
                'Free Style',
                'Grenadier',
                'Poison Resistance'
              ]
            },
            {
              name: 'Arcane Mechanik',
              requiredArchetype: 'Gifted',
              availableAbilities: [
                "'Jack Marshal",
                'Ace Commander',
                'Arcane Engineer',
                'Drive: Assault',
                'Drive: Pronto',
                'Inscribe Formulae',
                'Resourceful',
                'Steamo'
              ]
            },
            {
              name: 'Arcanist',
              requiredArchetype: 'Gifted',
              availableAbilities: []
            },
            {
              name: 'Aristocrat',
              requiredRace: 'Human',
              startingCareerOnly: true,
              availableAbilities: [
                "Natural Leader",
              ]
            },
            {
              name: 'Gun Mage',
              requiredArchetype: 'Gifted',
              availableAbilities: [
                "Arcane Precision",
                "Craft Rune Shot",
                "Fast Draw",
                "Fast Reload",
                "Gunfighter",
                "Keen Eyed"
              ]
            },
            {
              name: 'Highwayman',
              availableAbilities: [
                "Ambush",
                "Appraise",
                "Binding",
                "Expert Rider",
                "Fast Draw",
                "Fast Reload",
                "Light Cavalry",
                "Prowl",
                "Ride-By Attack",
                "Saddle Shot",
                "Swift Hunter",
                "Swift Rider",
                "Traceless Path",
                "Two-Weapon Fighting",
                "Waylay"
              ]
            }
          ]);
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
          self.availableArchetypes([
            {
              name: 'Gifted',
              benefits: []
            },
            {
              name: 'Intellectual',
              benefits: []
            },
            {
              name: 'Mighty',
              benefits: []
            },
            {
              name: 'Skilled',
              benefits: []
            }
          ]);
          self.availableRaces([
            {
              name: 'Human',
              availableArchetypes: [
                'Gifted',
                'Intellectual',
                'Mighty',
                'Skilled'
              ]
            },
            {
              name: 'Dwarf',
              availableArchetypes: [
                'Gifted',
                'Intellectual',
                'Mighty',
                'Skilled'
              ]
            },
            {
              name: 'Gobber',
              availableArchetypes: [
                'Intellectual',
                'Mighty',
                'Skilled'
              ]
            },
            {
              name: 'Iosan',
              availableArchetypes: [
                'Gifted',
                'Intellectual',
                'Mighty',
                'Skilled'
              ]
            },
            {
              name: 'Nyss',
              availableArchetypes: [
                'Gifted',
                'Mighty',
                'Skilled'
              ]
            },
            {
              name: 'Ogrun',
              availableArchetypes: [
                'Mighty',
                'Skilled'
              ]
            },
            {
              name: 'Trollkin',
              availableArchetypes: [
                'Gifted',
                'Mighty',
                'Skilled'
              ]
            },
          ]);
}


