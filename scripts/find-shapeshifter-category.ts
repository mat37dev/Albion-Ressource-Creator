const GITHUB_RAW = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master';

async function findCategory() {
  const response = await fetch(`${GITHUB_RAW}/items.json`);
  const rawData = await response.json();
  const itemsRoot = rawData.items || {};

  console.log('Available categories:');
  console.log(Object.keys(itemsRoot));
  console.log('');

  // Check each category
  for (const [category, items] of Object.entries(itemsRoot)) {
    if (!Array.isArray(items)) continue;

    const found = items.find((item: any) =>
      item['@uniquename'] === 'T4_2H_SHAPESHIFTER_MORGANA'
    );

    if (found) {
      console.log(`✅ Found T4_2H_SHAPESHIFTER_MORGANA in category: ${category}`);
      console.log(`   Has craftingrequirements: ${!!found.craftingrequirements}`);
      console.log(`   Has enchantments: ${!!found.enchantments}`);

      if (found.enchantments?.enchantment) {
        const enchants = Array.isArray(found.enchantments.enchantment)
          ? found.enchantments.enchantment
          : [found.enchantments.enchantment];
        console.log(`   Enchantment levels: ${enchants.length}`);

        const firstEnchant = enchants[0];
        if (firstEnchant?.craftingrequirements) {
          console.log('\n📝 First enchantment recipe:');
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

      return;
    }
  }

  console.log('❌ Not found in any category');
}

findCategory().catch(console.error);
