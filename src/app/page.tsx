import { MenuView } from "@/components/MenuView";
import { readMenu } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function HomePage() {
  const menu = await readMenu();
  return <MenuView categories={menu.categories} products={menu.products} />;
}
