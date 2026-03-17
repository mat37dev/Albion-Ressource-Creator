/**
 * Armes complètes T4-T8 - 8 armes par catégorie
 */

import type { AlbionItem, WeaponSubcategory } from "./types";

interface WeaponDef {
  id: string;
  nameEN: string;
  nameFR: string;
  subcategory: WeaponSubcategory;
  isArtifact?: boolean;
}

// ═══════════════════════════════════════════════
// SWORDS (8)
// ═══════════════════════════════════════════════
const SWORDS: WeaponDef[] = [
  { id: "MAIN_SWORD", nameEN: "Broadsword", nameFR: "Épée large", subcategory: "sword" },
  { id: "2H_CLAYMORE", nameEN: "Claymore", nameFR: "Claymore", subcategory: "sword" },
  { id: "2H_DUALSWORD", nameEN: "Dual Swords", nameFR: "Doubles épées", subcategory: "sword" },
  { id: "2H_CLEAVER", nameEN: "Clarent Blade", nameFR: "Lame de Clarent", subcategory: "sword", isArtifact: true },
  { id: "2H_DUALSCIMITAR_MORGANA", nameEN: "Carving Sword", nameFR: "Épée tranchante", subcategory: "sword", isArtifact: true },
  { id: "2H_SWORD", nameEN: "Galatine Pair", nameFR: "Paire Galatine", subcategory: "sword", isArtifact: true },
  { id: "2H_CLAYMORE_AVALON", nameEN: "Kingmaker", nameFR: "Faiseur de rois", subcategory: "sword", isArtifact: true },
  { id: "2H_DUALSWORD_CRYSTAL", nameEN: "Realmbreaker", nameFR: "Brise-royaume", subcategory: "sword", isArtifact: true },
];

// ═══════════════════════════════════════════════
// AXES (8)
// ═══════════════════════════════════════════════
const AXES: WeaponDef[] = [
  { id: "MAIN_AXE", nameEN: "Battleaxe", nameFR: "Hache de bataille", subcategory: "axe" },
  { id: "2H_AXE", nameEN: "Greataxe", nameFR: "Grande hache", subcategory: "axe" },
  { id: "2H_HALBERD", nameEN: "Halberd", nameFR: "Hallebarde", subcategory: "axe" },
  { id: "2H_HALBERD_MORGANA", nameEN: "Carrioncaller", nameFR: "Invocateur de charogne", subcategory: "axe", isArtifact: true },
  { id: "2H_SCYTHE_HELL", nameEN: "Infernal Scythe", nameFR: "Faux infernale", subcategory: "axe", isArtifact: true },
  { id: "MAIN_SCIMITAR_MORGANA", nameEN: "Bloodletter", nameFR: "Saigneur", subcategory: "axe", isArtifact: true },
  { id: "2H_AXE_AVALON", nameEN: "Bear Paws", nameFR: "Pattes d'ours", subcategory: "axe", isArtifact: true },
  { id: "2H_HALBERD_CRYSTAL", nameEN: "Demonfang", nameFR: "Croc démoniaque", subcategory: "axe", isArtifact: true },
];

// ═══════════════════════════════════════════════
// MACES (8)
// ═══════════════════════════════════════════════
const MACES: WeaponDef[] = [
  { id: "MAIN_MACE", nameEN: "Mace", nameFR: "Masse", subcategory: "mace" },
  { id: "2H_MACE", nameEN: "Heavy Mace", nameFR: "Masse lourde", subcategory: "mace" },
  { id: "2H_FLAIL", nameEN: "Morning Star", nameFR: "Morgenstern", subcategory: "mace" },
  { id: "MAIN_ROCKMACE_KEEPER", nameEN: "Bedrock Mace", nameFR: "Masse de roc", subcategory: "mace", isArtifact: true },
  { id: "MAIN_MACE_HELL", nameEN: "Incubus Mace", nameFR: "Masse d'incube", subcategory: "mace", isArtifact: true },
  { id: "2H_MACE_MORGANA", nameEN: "Forge Hammer", nameFR: "Marteau de forge", subcategory: "mace", isArtifact: true },
  { id: "2H_FLAIL_AVALON", nameEN: "Camlann Mace", nameFR: "Masse de Camlann", subcategory: "mace", isArtifact: true },
  { id: "MAIN_MACE_CRYSTAL", nameEN: "Oathkeeper", nameFR: "Gardien des serments", subcategory: "mace", isArtifact: true },
];

// ═══════════════════════════════════════════════
// HAMMERS (8)
// ═══════════════════════════════════════════════
const HAMMERS: WeaponDef[] = [
  { id: "2H_HAMMER", nameEN: "Great Hammer", nameFR: "Grand marteau", subcategory: "hammer" },
  { id: "2H_POLEHAMMER", nameEN: "Polehammer", nameFR: "Marteau d'hast", subcategory: "hammer" },
  { id: "2H_HAMMER_UNDEAD", nameEN: "Tombhammer", nameFR: "Marteau de tombe", subcategory: "hammer", isArtifact: true },
  { id: "2H_RAM_KEEPER", nameEN: "Grovekeeper", nameFR: "Gardien de bosquet", subcategory: "hammer", isArtifact: true },
  { id: "2H_HAMMER_HELL", nameEN: "Forge Hammer", nameFR: "Marteau de forge", subcategory: "hammer", isArtifact: true },
  { id: "2H_HAMMER_AVALON", nameEN: "Hand of Justice", nameFR: "Main de justice", subcategory: "hammer", isArtifact: true },
  { id: "2H_POLEHAMMER_CRYSTAL", nameEN: "Permafrost Prism", nameFR: "Prisme de permafrost", subcategory: "hammer", isArtifact: true },
  { id: "2H_HAMMER_CRYSTAL", nameEN: "Siegebreaker", nameFR: "Brise-siège", subcategory: "hammer", isArtifact: true },
];

// ═══════════════════════════════════════════════
// CROSSBOWS (8)
// ═══════════════════════════════════════════════
const CROSSBOWS: WeaponDef[] = [
  { id: "MAIN_CROSSBOW", nameEN: "Crossbow", nameFR: "Arbalète", subcategory: "crossbow" },
  { id: "2H_CROSSBOW", nameEN: "Heavy Crossbow", nameFR: "Arbalète lourde", subcategory: "crossbow" },
  { id: "2H_CROSSBOWLARGE", nameEN: "Siege Bow", nameFR: "Arc de siège", subcategory: "crossbow" },
  { id: "MAIN_CROSSBOW_CANNON", nameEN: "Boltcasters", nameFR: "Lance-carreaux", subcategory: "crossbow", isArtifact: true },
  { id: "2H_DUALCROSSBOW_HELL", nameEN: "Weeping Repeater", nameFR: "Répéteur pleureur", subcategory: "crossbow", isArtifact: true },
  { id: "2H_CROSSBOW_CANNON_MORGANA", nameEN: "Energy Shaper", nameFR: "Modeleur d'énergie", subcategory: "crossbow", isArtifact: true },
  { id: "2H_CROSSBOW_AVALON", nameEN: "Siegebow", nameFR: "Arc de siège", subcategory: "crossbow", isArtifact: true },
  { id: "2H_CROSSBOWLARGE_CRYSTAL", nameEN: "Dawnsong", nameFR: "Chant de l'aube", subcategory: "crossbow", isArtifact: true },
];

// ═══════════════════════════════════════════════
// BOWS (8)
// ═══════════════════════════════════════════════
const BOWS: WeaponDef[] = [
  { id: "2H_BOW", nameEN: "Bow", nameFR: "Arc", subcategory: "bow" },
  { id: "2H_WARBOW", nameEN: "Warbow", nameFR: "Arc de guerre", subcategory: "bow" },
  { id: "2H_LONGBOW", nameEN: "Longbow", nameFR: "Arc long", subcategory: "bow" },
  { id: "2H_LONGBOW_UNDEAD", nameEN: "Wailing Bow", nameFR: "Arc gémissant", subcategory: "bow", isArtifact: true },
  { id: "2H_BOW_HELL", nameEN: "Bow of Badon", nameFR: "Arc de Badon", subcategory: "bow", isArtifact: true },
  { id: "2H_BOW_KEEPER", nameEN: "Whispering Bow", nameFR: "Arc murmurant", subcategory: "bow", isArtifact: true },
  { id: "2H_BOW_AVALON", nameEN: "Energ Shaper", nameFR: "Modeleur d'énergie", subcategory: "bow", isArtifact: true },
  { id: "2H_WARBOW_CRYSTAL", nameEN: "Mistpiercer", nameFR: "Perce-brume", subcategory: "bow", isArtifact: true },
];

// ═══════════════════════════════════════════════
// SPEARS (8)
// ═══════════════════════════════════════════════
const SPEARS: WeaponDef[] = [
  { id: "MAIN_SPEAR", nameEN: "Spear", nameFR: "Lance", subcategory: "spear" },
  { id: "2H_SPEAR", nameEN: "Pike", nameFR: "Pique", subcategory: "spear" },
  { id: "2H_GLAIVE", nameEN: "Glaive", nameFR: "Glaive", subcategory: "spear" },
  { id: "MAIN_SPEAR_KEEPER", nameEN: "Spirithunter", nameFR: "Chasseur d'esprits", subcategory: "spear", isArtifact: true },
  { id: "2H_HARPOON_HELL", nameEN: "Trinity Spear", nameFR: "Lance trinité", subcategory: "spear", isArtifact: true },
  { id: "2H_TRIDENT_UNDEAD", nameEN: "Daybreaker", nameFR: "Briseur d'aube", subcategory: "spear", isArtifact: true },
  { id: "2H_SPEAR_AVALON", nameEN: "Spirithunter", nameFR: "Chasseur d'esprits", subcategory: "spear", isArtifact: true },
  { id: "2H_GLAIVE_CRYSTAL", nameEN: "Heron Spear", nameFR: "Lance du héron", subcategory: "spear", isArtifact: true },
];

// ═══════════════════════════════════════════════
// DAGGERS (8)
// ═══════════════════════════════════════════════
const DAGGERS: WeaponDef[] = [
  { id: "MAIN_DAGGER", nameEN: "Dagger", nameFR: "Dague", subcategory: "dagger" },
  { id: "2H_DAGGERPAIR", nameEN: "Dagger Pair", nameFR: "Paire de dagues", subcategory: "dagger" },
  { id: "2H_CLAWPAIR", nameEN: "Claws", nameFR: "Griffes", subcategory: "dagger" },
  { id: "2H_DUALSICKLE_UNDEAD", nameEN: "Deathgivers", nameFR: "Donneurs de mort", subcategory: "dagger", isArtifact: true },
  { id: "2H_DAGGER_KATAR_AVALON", nameEN: "Black Hands", nameFR: "Mains noires", subcategory: "dagger", isArtifact: true },
  { id: "MAIN_RAPIER_MORGANA", nameEN: "Bloodletter", nameFR: "Saigneur", subcategory: "dagger", isArtifact: true },
  { id: "2H_IRONGAUNTLETS_HELL", nameEN: "Bridled Fury", nameFR: "Fureur bridée", subcategory: "dagger", isArtifact: true },
  { id: "2H_CLAWPAIR_CRYSTAL", nameEN: "Shadowfang", nameFR: "Croc d'ombre", subcategory: "dagger", isArtifact: true },
];

// ═══════════════════════════════════════════════
// QUARTERSTAFFS (8)
// ═══════════════════════════════════════════════
const QUARTERSTAFFS: WeaponDef[] = [
  { id: "2H_QUARTERSTAFF", nameEN: "Quarterstaff", nameFR: "Bâton", subcategory: "quarterstaff" },
  { id: "2H_IRONCLADEDSTAFF", nameEN: "Iron-clad Staff", nameFR: "Bâton ferré", subcategory: "quarterstaff" },
  { id: "2H_DOUBLEBLADEDSTAFF", nameEN: "Double Bladed Staff", nameFR: "Bâton à double lame", subcategory: "quarterstaff" },
  { id: "2H_COMBATSTAFF_MORGANA", nameEN: "Black Monk Stave", nameFR: "Bâton de moine noir", subcategory: "quarterstaff", isArtifact: true },
  { id: "2H_TWINSCYTHE_HELL", nameEN: "Soulscythe", nameFR: "Faux d'âme", subcategory: "quarterstaff", isArtifact: true },
  { id: "2H_ROCKSTAFF_KEEPER", nameEN: "Staff of Balance", nameFR: "Bâton d'équilibre", subcategory: "quarterstaff", isArtifact: true },
  { id: "2H_QUARTERSTAFF_AVALON", nameEN: "Trinity Spear", nameFR: "Lance trinité", subcategory: "quarterstaff", isArtifact: true },
  { id: "2H_DOUBLEBLADEDSTAFF_CRYSTAL", nameEN: "Ravenstrike", nameFR: "Frappe du corbeau", subcategory: "quarterstaff", isArtifact: true },
];

// ═══════════════════════════════════════════════
// FIRE STAFFS (8)
// ═══════════════════════════════════════════════
const FIRE_STAFFS: WeaponDef[] = [
  { id: "MAIN_FIRESTAFF", nameEN: "Fire Staff", nameFR: "Bâton de feu", subcategory: "fire" },
  { id: "2H_FIRESTAFF", nameEN: "Great Fire Staff", nameFR: "Grand bâton de feu", subcategory: "fire" },
  { id: "2H_INFERNOSTAFF", nameEN: "Infernal Staff", nameFR: "Bâton infernal", subcategory: "fire" },
  { id: "MAIN_FIRESTAFF_KEEPER", nameEN: "Wildfire Staff", nameFR: "Bâton de feu sauvage", subcategory: "fire", isArtifact: true },
  { id: "2H_FIRESTAFF_HELL", nameEN: "Brimstone Staff", nameFR: "Bâton de soufre", subcategory: "fire", isArtifact: true },
  { id: "2H_FIRESTAFF_KEEPER", nameEN: "Blazing Staff", nameFR: "Bâton flamboyant", subcategory: "fire", isArtifact: true },
  { id: "2H_INFERNOSTAFF_AVALON", nameEN: "Dawnsong", nameFR: "Chant de l'aube", subcategory: "fire", isArtifact: true },
  { id: "MAIN_FIRESTAFF_CRYSTAL", nameEN: "Flamewalker", nameFR: "Marcheur de flammes", subcategory: "fire", isArtifact: true },
];

// ═══════════════════════════════════════════════
// FROST STAFFS (8)
// ═══════════════════════════════════════════════
const FROST_STAFFS: WeaponDef[] = [
  { id: "MAIN_FROSTSTAFF", nameEN: "Frost Staff", nameFR: "Bâton de givre", subcategory: "frost" },
  { id: "2H_FROSTSTAFF", nameEN: "Great Frost Staff", nameFR: "Grand bâton de givre", subcategory: "frost" },
  { id: "2H_GLACIALSTAFF", nameEN: "Glacial Staff", nameFR: "Bâton glacial", subcategory: "frost" },
  { id: "MAIN_FROSTSTAFF_KEEPER", nameEN: "Hoarfrost Staff", nameFR: "Bâton de givre blanc", subcategory: "frost", isArtifact: true },
  { id: "2H_ICEGAUNTLETS_HELL", nameEN: "Icicle Staff", nameFR: "Bâton de glace", subcategory: "frost", isArtifact: true },
  { id: "2H_ICECRYSTAL_UNDEAD", nameEN: "Permafrost Prism", nameFR: "Prisme de permafrost", subcategory: "frost", isArtifact: true },
  { id: "2H_GLACIALSTAFF_AVALON", nameEN: "Chillhowl", nameFR: "Hurlement glacial", subcategory: "frost", isArtifact: true },
  { id: "MAIN_FROSTSTAFF_CRYSTAL", nameEN: "Icefall", nameFR: "Chute de glace", subcategory: "frost", isArtifact: true },
];

// ═══════════════════════════════════════════════
// CURSE STAFFS (8)
// ═══════════════════════════════════════════════
const CURSE_STAFFS: WeaponDef[] = [
  { id: "MAIN_CURSEDSTAFF", nameEN: "Cursed Staff", nameFR: "Bâton maudit", subcategory: "curse" },
  { id: "2H_CURSEDSTAFF", nameEN: "Great Cursed Staff", nameFR: "Grand bâton maudit", subcategory: "curse" },
  { id: "2H_DEMONICSTAFF", nameEN: "Demonic Staff", nameFR: "Bâton démoniaque", subcategory: "curse" },
  { id: "MAIN_CURSEDSTAFF_UNDEAD", nameEN: "Cursed Skull", nameFR: "Crâne maudit", subcategory: "curse", isArtifact: true },
  { id: "2H_SKULLORB_HELL", nameEN: "Damnation Staff", nameFR: "Bâton de damnation", subcategory: "curse", isArtifact: true },
  { id: "2H_CURSEDSTAFF_MORGANA", nameEN: "Shadowcaller", nameFR: "Invocateur d'ombre", subcategory: "curse", isArtifact: true },
  { id: "2H_DEMONICSTAFF_AVALON", nameEN: "Lifecurse Staff", nameFR: "Bâton de malédiction", subcategory: "curse", isArtifact: true },
  { id: "MAIN_CURSEDSTAFF_CRYSTAL", nameEN: "Dreadweave", nameFR: "Tissecrépuscule", subcategory: "curse", isArtifact: true },
];

// ═══════════════════════════════════════════════
// ARCANE STAFFS (8)
// ═══════════════════════════════════════════════
const ARCANE_STAFFS: WeaponDef[] = [
  { id: "MAIN_ARCANESTAFF", nameEN: "Arcane Staff", nameFR: "Bâton arcanique", subcategory: "arcane" },
  { id: "2H_ARCANESTAFF", nameEN: "Great Arcane Staff", nameFR: "Grand bâton arcanique", subcategory: "arcane" },
  { id: "2H_ENIGMATICSTAFF", nameEN: "Enigmatic Staff", nameFR: "Bâton énigmatique", subcategory: "arcane" },
  { id: "MAIN_ARCANESTAFF_UNDEAD", nameEN: "Occult Staff", nameFR: "Bâton occulte", subcategory: "arcane", isArtifact: true },
  { id: "2H_ARCANESTAFF_HELL", nameEN: "Malevolent Locus", nameFR: "Locus maléfique", subcategory: "arcane", isArtifact: true },
  { id: "2H_ENIGMATICORB_MORGANA", nameEN: "Evensong", nameFR: "Chant du soir", subcategory: "arcane", isArtifact: true },
  { id: "2H_ENIGMATICSTAFF_AVALON", nameEN: "Cosmos", nameFR: "Cosmos", subcategory: "arcane", isArtifact: true },
  { id: "MAIN_ARCANESTAFF_CRYSTAL", nameEN: "Shimmerbow", nameFR: "Arc chatoyant", subcategory: "arcane", isArtifact: true },
];

// ═══════════════════════════════════════════════
// HOLY STAFFS (8)
// ═══════════════════════════════════════════════
const HOLY_STAFFS: WeaponDef[] = [
  { id: "MAIN_HOLYSTAFF", nameEN: "Holy Staff", nameFR: "Bâton saint", subcategory: "holy" },
  { id: "2H_HOLYSTAFF", nameEN: "Great Holy Staff", nameFR: "Grand bâton saint", subcategory: "holy" },
  { id: "2H_DIVINESTAFF", nameEN: "Divine Staff", nameFR: "Bâton divin", subcategory: "holy" },
  { id: "MAIN_HOLYSTAFF_MORGANA", nameEN: "Lifetouch Staff", nameFR: "Bâton de vie", subcategory: "holy", isArtifact: true },
  { id: "2H_HOLYSTAFF_HELL", nameEN: "Fallen Staff", nameFR: "Bâton déchu", subcategory: "holy", isArtifact: true },
  { id: "2H_HOLYSTAFF_UNDEAD", nameEN: "Redemption Staff", nameFR: "Bâton de rédemption", subcategory: "holy", isArtifact: true },
  { id: "2H_DIVINESTAFF_AVALON", nameEN: "Hallowfall", nameFR: "Chute sacrée", subcategory: "holy", isArtifact: true },
  { id: "MAIN_HOLYSTAFF_CRYSTAL", nameEN: "Brightstaff", nameFR: "Bâton lumineux", subcategory: "holy", isArtifact: true },
];

// ═══════════════════════════════════════════════
// NATURE STAFFS (8)
// ═══════════════════════════════════════════════
const NATURE_STAFFS: WeaponDef[] = [
  { id: "MAIN_NATURESTAFF", nameEN: "Nature Staff", nameFR: "Bâton de nature", subcategory: "nature" },
  { id: "2H_NATURESTAFF", nameEN: "Great Nature Staff", nameFR: "Grand bâton de nature", subcategory: "nature" },
  { id: "2H_WILDSTAFF", nameEN: "Wild Staff", nameFR: "Bâton sauvage", subcategory: "nature" },
  { id: "MAIN_NATURESTAFF_KEEPER", nameEN: "Blight Staff", nameFR: "Bâton de fléau", subcategory: "nature", isArtifact: true },
  { id: "2H_NATURESTAFF_HELL", nameEN: "Rampant Staff", nameFR: "Bâton rampant", subcategory: "nature", isArtifact: true },
  { id: "2H_NATURESTAFF_KEEPER", nameEN: "Druidic Staff", nameFR: "Bâton druidique", subcategory: "nature", isArtifact: true },
  { id: "2H_WILDSTAFF_AVALON", nameEN: "Rampant Staff", nameFR: "Bâton rampant", subcategory: "nature", isArtifact: true },
  { id: "MAIN_NATURESTAFF_CRYSTAL", nameEN: "Thornshaper", nameFR: "Modeleur d'épines", subcategory: "nature", isArtifact: true },
];

// ═══════════════════════════════════════════════
// SHAPESHIFTER (8)
// ═══════════════════════════════════════════════
const SHAPESHIFTERS: WeaponDef[] = [
  { id: "2H_SHAPESHIFTER_SET1", nameEN: "Bear Paws", nameFR: "Pattes d'ours", subcategory: "shapeshifter" },
  { id: "2H_SHAPESHIFTER_SET2", nameEN: "Werewolf", nameFR: "Loup-garou", subcategory: "shapeshifter" },
  { id: "2H_SHAPESHIFTER_SET3", nameEN: "Raven", nameFR: "Corbeau", subcategory: "shapeshifter" },
  { id: "2H_SHAPESHIFTER_MORGANA", nameEN: "Wildcat", nameFR: "Chat sauvage", subcategory: "shapeshifter", isArtifact: true },
  { id: "2H_SHAPESHIFTER_HELL", nameEN: "Imp", nameFR: "Diablotin", subcategory: "shapeshifter", isArtifact: true },
  { id: "2H_SHAPESHIFTER_KEEPER", nameEN: "Stag", nameFR: "Cerf", subcategory: "shapeshifter", isArtifact: true },
  { id: "2H_SHAPESHIFTER_AVALON", nameEN: "Direwolf", nameFR: "Loup terrible", subcategory: "shapeshifter", isArtifact: true },
  { id: "2H_SHAPESHIFTER_CRYSTAL", nameEN: "Primal Panther", nameFR: "Panthère primordiale", subcategory: "shapeshifter", isArtifact: true },
];

// ═══════════════════════════════════════════════
// OFFHANDS
// ═══════════════════════════════════════════════
const OFFHANDS: WeaponDef[] = [
  { id: "OFF_SHIELD", nameEN: "Shield", nameFR: "Bouclier", subcategory: "sword" },
  { id: "OFF_TOWERSHIELD_UNDEAD", nameEN: "Sarcophagus", nameFR: "Sarcophage", subcategory: "sword", isArtifact: true },
  { id: "OFF_SHIELD_HELL", nameEN: "Facebreaker", nameFR: "Brise-face", subcategory: "sword", isArtifact: true },
  { id: "OFF_TORCH", nameEN: "Torch", nameFR: "Torche", subcategory: "fire" },
  { id: "OFF_HORN_KEEPER", nameEN: "Mistcaller", nameFR: "Invocateur de brume", subcategory: "nature", isArtifact: true },
  { id: "OFF_JESTERCANE_HELL", nameEN: "Leering Cane", nameFR: "Canne moqueuse", subcategory: "curse", isArtifact: true },
  { id: "OFF_LAMP_UNDEAD", nameEN: "Astral Aegis", nameFR: "Égide astrale", subcategory: "arcane", isArtifact: true },
  { id: "OFF_BOOK", nameEN: "Tome of Spells", nameFR: "Tome de sorts", subcategory: "arcane" },
  { id: "OFF_ORB", nameEN: "Muisak", nameFR: "Muisak", subcategory: "arcane" },
  { id: "OFF_TOTEM_AVALON", nameEN: "Taproot", nameFR: "Racine pivotante", subcategory: "nature", isArtifact: true },
];

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

const ALL_WEAPONS: WeaponDef[] = [
  ...SWORDS,
  ...AXES,
  ...MACES,
  ...HAMMERS,
  ...CROSSBOWS,
  ...BOWS,
  ...SPEARS,
  ...DAGGERS,
  ...QUARTERSTAFFS,
  ...FIRE_STAFFS,
  ...FROST_STAFFS,
  ...CURSE_STAFFS,
  ...ARCANE_STAFFS,
  ...HOLY_STAFFS,
  ...NATURE_STAFFS,
  ...SHAPESHIFTERS,
];

const ENCHANT_LABELS = ["", ".1", ".2", ".3", ".4"];

function tierLabel(tier: number, enchant: number): string {
  return `T${tier}${ENCHANT_LABELS[enchant]}`;
}

// ═══════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════

function generateWeapons(): AlbionItem[] {
  const items: AlbionItem[] = [];

  for (const weapon of ALL_WEAPONS) {
    for (let tier = 4; tier <= 8; tier++) {
      for (let enchant = 0; enchant <= 4; enchant++) {
        const suffix = enchant > 0 ? `@${enchant}` : "";
        const label = tierLabel(tier, enchant);

        items.push({
          id: `T${tier}_${weapon.id}${suffix}`,
          nameEN: `${label} ${weapon.nameEN}`,
          nameFR: `${label} ${weapon.nameFR}`,
          tier,
          enchant,
          category: "weapon",
          subcategory: weapon.subcategory,
          isArtifact: weapon.isArtifact,
        });
      }
    }
  }

  return items;
}

function generateOffhands(): AlbionItem[] {
  const items: AlbionItem[] = [];

  for (const offhand of OFFHANDS) {
    for (let tier = 4; tier <= 8; tier++) {
      for (let enchant = 0; enchant <= 4; enchant++) {
        const suffix = enchant > 0 ? `@${enchant}` : "";
        const label = tierLabel(tier, enchant);

        items.push({
          id: `T${tier}_${offhand.id}${suffix}`,
          nameEN: `${label} ${offhand.nameEN}`,
          nameFR: `${label} ${offhand.nameFR}`,
          tier,
          enchant,
          category: "offhand",
          subcategory: offhand.subcategory,
          isArtifact: offhand.isArtifact,
        });
      }
    }
  }

  return items;
}

// ═══════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════

export function getAllWeapons(): AlbionItem[] {
  return [...generateWeapons(), ...generateOffhands()];
}

export function getWeaponsBySubcategory(subcategory: WeaponSubcategory): AlbionItem[] {
  return generateWeapons().filter((w) => w.subcategory === subcategory);
}

export function getArtifactWeapons(): AlbionItem[] {
  return generateWeapons().filter((w) => w.isArtifact);
}

export function getOffhands(): AlbionItem[] {
  return generateOffhands();
}
