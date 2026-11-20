import { products as fixtureProducts } from "@/lib/products";
import type { createAdminClient } from "@/lib/supabase/admin";

export type CheckoutProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  source: "database" | "fixture";
};

/**
 * Resolves trusted product data on the server. The database is the source of
 * truth once the catalog has been seeded; fixture rows keep checkout usable
 * while the storefront catalog is still local.
 */
export async function resolveCheckoutProducts(
  admin: ReturnType<typeof createAdminClient>,
  ids: string[],
): Promise<CheckoutProduct[]> {
  const uniqueIds = Array.from(new Set(ids));
  const databaseProducts = new Map<string, CheckoutProduct>();
  const unavailableIds = new Set<string>();

  try {
    const { data, error } = await admin
      .from("products")
      .select("id, name, price, stock_quantity, status")
      .in("id", uniqueIds);

    if (!error && data) {
      for (const row of data) {
        // A row that exists but is not active must not fall back to the fixture
        // catalog, otherwise an archived product could still be purchased.
        if (row.status !== "active") {
          unavailableIds.add(row.id);
          continue;
        }
        databaseProducts.set(row.id, {
          id: row.id,
          name: row.name,
          price: row.price,
          stock: row.stock_quantity,
          source: "database",
        });
      }
    }
  } catch {
    // Fall through to fixtures when the database is unreachable.
  }

  const fixtures = new Map(fixtureProducts.map((product) => [product.id, product]));

  return uniqueIds.flatMap((id) => {
    const databaseProduct = databaseProducts.get(id);
    if (databaseProduct) return [databaseProduct];
    if (unavailableIds.has(id)) return [];

    const fixture = fixtures.get(id);
    if (!fixture) return [];

    return [
      {
        id: fixture.id,
        name: fixture.name,
        price: fixture.price,
        stock: fixture.stock,
        source: "fixture" as const,
      },
    ];
  });
}
