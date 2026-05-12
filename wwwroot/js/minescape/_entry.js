// Single entry point bundled into dist/minescape-solvers.js by esbuild.
// Each solver self-registers DOM listeners at module load, so importing the
// file is the trigger.
//
// Order: data.js first because every other solver imports `database` from it;
// tabs.js next because it sets up the visible-state machine; the rest can
// follow in any order.
import './data.js';
import './tabs.js';
import './puzzle.js';
import './light.js';
import './cypher.js';
import './anagram.js';
import './chest.js';
import './beacon.js';
import './hotcold.js';
import './map.js';
import './ge.js';
