import { MenuView } from "@/components/MenuView";
import { readMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const menu = readMenu();
  return <MenuView categories={menu.categories} products={menu.products} />;
}
