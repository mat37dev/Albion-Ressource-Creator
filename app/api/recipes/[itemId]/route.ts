import { NextRequest, NextResponse } from "next/server";
import {
  getRecipeForItem,
  getRecipeVariants,
  getRecipeByItemAndEnchant,
} from "@/lib/db/queries/recipes";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const { searchParams } = new URL(request.url);
  const includeVariants = searchParams.get("variants") === "true";
  const enchantLevel = searchParams.get("enchant");

  try {
    // Si on veut toutes les variantes (enchantements)
    if (includeVariants) {
      const variants = await getRecipeVariants(itemId);
      return NextResponse.json({ variants });
    }

    // Déterminer le niveau d'enchantement : depuis ?enchant= ou depuis le suffixe @N de l'itemId
    const enchantSuffix = itemId.match(/@(\d)$/);
    const resolvedEnchantLevel = enchantLevel !== null
      ? parseInt(enchantLevel)
      : enchantSuffix
        ? parseInt(enchantSuffix[1])
        : null;

    if (resolvedEnchantLevel !== null && resolvedEnchantLevel > 0) {
      const baseItemId = itemId.replace(/@\d$/, '');
      const recipe = await getRecipeByItemAndEnchant(baseItemId, resolvedEnchantLevel);

      if (!recipe) {
        return NextResponse.json(
          { error: "Recipe not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(recipe);
    }

    // Recette de base (enchant 0)
    const recipe = await getRecipeForItem(itemId);

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
