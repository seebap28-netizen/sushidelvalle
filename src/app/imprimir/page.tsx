import { PrintMenu } from "@/components/PrintMenu";
import { readMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ print?: string }>;
}) {
  const params = await searchParams;
  return <PrintMenu menu={await readMenu()} autoPrint={params.print === "1"} />;
}
