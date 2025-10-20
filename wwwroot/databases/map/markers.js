var markers = {
    "minescape": [
        {
            "groupName": "beacons",
            "displayName": "Beacons",
            "icon": "icons/beacons.png",
            "createInfoWindow": true,
            "checked": true
        },
        {
            "groupName": "shortcuts",
            "displayName": "Shortcuts",
            "icon": "icons/shortcuts.png",
            "createInfoWindow": true,
            "checked": true
        },
        {
            "groupName": "teleportsGlory",
            "displayName": "Teleports Glory",
            "icon": "icons/Amulet_of_glory.png",
            "createInfoWindow": true,
            "checked": true
        },
        {
            "groupName": "teleportsGames",
            "displayName": "Teleports Games",
            "icon": "icons/Games_necklace.png",
            "createInfoWindow": true,
            "checked": true
        },
        {
            "groupName": "teleportsDueling",
            "displayName": "Teleports Dueling",
            "icon": "icons/Ring_of_dueling.png",
            "createInfoWindow": true,
            "checked": true
        },
        {
            "groupName": "teleportsFairy",
            "displayName": "Teleports Fairy",
            "icon": "icons/Transportation.png",
            "createInfoWindow": true,
            "checked": true
        },
        {
            "groupName": "teleportsSkills",
            "displayName": "Teleports Skills",
            "icon": "icons/Skills_necklace.png",
            "createInfoWindow": true,
            "checked": true
        },
        {
            "groupName": "teleportsMagic",
            "displayName": "Teleports Magic",
            "icon": "icons/Varrock_Teleport.png",
            "createInfoWindow": true,
            "checked": true
        },
        {
            "groupName": "teleportsClue",
            "displayName": "Teleports Clue",
            "icon": "icons/Digsite_teleport.png",
            "createInfoWindow": true,
            "checked": true
        }
    ],
};
markers.minescape = markers.minescape.sort((a, b) => a.displayName.localeCompare(b.displayName))
