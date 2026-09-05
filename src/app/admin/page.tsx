import { AdminPanel } from "@/components/AdminPanel";
import { readMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminPanel initialMenu={readMenu()} />;
}
