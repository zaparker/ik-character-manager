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
                if(abilities.indexOf(ability) == -1)
                  abilities.push(ability);
              }
            }
            return $.map(abilities, function(ability) { return $.grep(self.availableAbilities(), function(abl) {return abl.name == ability;})[0]; });
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
              name: 'Fast Cook',
              requiredSkill: { name: 'Alchemy', level: 2 },
              description: 'The character has learned a number of time-saving shortcuts in the art of brewing potions and mixing alchemical substances. He can create alchemical items in half the normal time.',
              showInList: true
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
              description: "The character gains an additional quick action each turn that can be nsed onlv to pr-rll the pin on a grenade.",
              showInList: true
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


