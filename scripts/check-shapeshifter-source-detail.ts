const GITHUB_RAW = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master';

async function checkSource() {
  const response = await fetch(`${GITHUB_RAW}/items.json`);
  const rawData = await response.json();

  const allItems: any[] = [
    ...(Array.isArray(rawData.items.simpleitem) ? rawData.items.simpleitem : []),
    ...(Array.isArray(rawData.items.equipmentitem) ? rawData.items.equipmentitem : []),
    ...(Array.isArray(rawData.items.weapon) ? rawData.items.weapon : []),
  ];

  // Find artifact
  const artifact = allItems.find(item =>
    item['@uniquename'] === 'T4_ARTEFACT_2H_SHAPESHIFTER_MORGANA'
  );

  // Find weapon
  const weapon = allItems.find(item =>
    item['@uniquename'] === 'T4_2H_SHAPESHIFTER_MORGANA'
  );

  console.log('🔍 ARTIFACT: T4_ARTEFACT_2H_SHAPESHIFTER_MORGANA');
  console.log('  Found:', !!artifact);
  console.log('  Has craftingrequirements:', !!artifact?.craftingrequirements);
  console.log('  Has enchantments:', !!artifact?.enchantments);

  console.log('\n🔍 WEAPON: T4_2H_SHAPESHIFTER_MORGANA');
  console.log('  Found:', !!weapon);
  console.log('  Has craftingrequirements:', !!weapon?.craftingrequirements);
  console.log('  Has enchantments:', !!weapon?.enchantments);

  if (weapon?.craftingrequirements) {
    console.log('\n📝 Weapon crafting requirements:');
    const reqs = Array.isArray(weapon.craftingrequirements)
      ? weapon.craftingrequirements[0]
      : weapon.craftingrequirements;
    const materials = reqs.craftresource
      ? (Array.isArray(reqs.craftresource) ? reqs.craftresource : [reqs.craftresource])
      : [];
    materials.forEach((m: any) => {
      console.log(`  - ${m['@uniquename']} x${m['@count']}`);
    });
  }

  if (artifact?.craftingrequirements) {
    console.log('\n📝 Artifact crafting requirements:');
    const reqs = Array.isArray(artifact.craftingrequirements)
      ? artifact.craftingrequirements[0]
      : artifact.craftingrequirements;
    const materials = reqs.craftresource
      ? (Array.isArray(reqs.craftresource) ? reqs.craftresource : [reqs.craftresource])
      : [];
    materials.forEach((m: any) => {
      console.log(`  - ${m['@uniquename']} x${m['@count']}`);
    });
  }

  // Check enchantments on weapon
  if (weapon?.enchantments?.enchantment) {
    console.log('\n🎯 Weapon has enchantments!');
    const enchants = Array.isArray(weapon.enchantments.enchantment)
      ? weapon.enchantments.enchantment
      : [weapon.enchantments.enchantment];

    console.log(`  Total enchantment levels: ${enchants.length}`);
    const firstEnchant = enchants[0];
    if (firstEnchant?.craftingrequirements) {
      console.log('\n📝 Enchantment @1 crafting requirements:');
      const reqs = Array.isArray(firstEnchant.craftingrequirements)
        ? firstEnchant.craftingrequirements[0]
        : firstEnchant.craftingrequirements;
      const materials = reqs.craftresource
        ? (Array.isArray(reqs.craftresource) ? reqs.craftresource : [reqs.craftresource])
        : [];
      materials.forEach((m: any) => {
        console.log(`  - ${m['@uniquename']} x${m['@count']}`);
      });
    }
  }
}

checkSource().catch(console.error);
