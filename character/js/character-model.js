function CharacterModel() {
          return {
            name: '',
            sex: '',
            archetype: '',
            race: {
              name: 'Human',
              availableArchetypes: [
                'Gifted',
                'Intellectual',
                'Mighty',
                'Skilled'
              ]
            },
            careers: [],
            stats: {
              phy: 1,
              spd: 1,
              str: 1,
              agl: 1,
              prw: 1,
              poi: 1,
              int: 1,
              arc: 0,
              per: 1
            },
            abilities: [],
            skills: [
              {
                name: 'Detection',
                stat: 'agl',
                type: 'occupational',
                level: 2
              },
              {
                name: 'Rifle',
                stat: 'poi',
                type: 'military',
                level: 2
              },
              {
                name: 'Hand Weapon',
                stat: 'prw',
                type: 'military',
                level: 2
              }
            ],
            meleeWeapons: [
            {
                name: 'Sword',
                skill: 'Hand Weapon',
                pow: 3,
                attackModifier: 0,
                specialQualities: []
              },
            ],
            rangedWeapons: [
              {
                name: 'Rifle',
                skill: 'Rifle',
                range: 10,
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
            ],
            armor: {
              name: 'Tailored Plate',
              armor: 7,
              speedPenalty: 0,
              defPenalty: -2
            },
          };
        }