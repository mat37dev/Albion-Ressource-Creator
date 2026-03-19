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
    // Si un niveau d'enchantement est spécifié
    if (enchantLevel !== null) {
      const level = parseInt(enchantLevel);
      const recipe = await getRecipeByItemAndEnchant(itemId, level);

      if (!recipe) {
        return NextResponse.json(
          { error: "Recipe not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(recipe);
    }

    // Si on veut toutes les variantes (enchantements)
    if (includeVariants) {
      const variants = await getRecipeVariants(itemId);
      return NextResponse.json({ variants });
    }

    // Sinon, récupérer la recette par défaut (enchant 0)
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
