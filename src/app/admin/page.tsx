import { AdminPanel } from "@/components/AdminPanel";
import { readMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <AdminPanel initialMenu={await readMenu()} />;
}
