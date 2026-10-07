import { Guest } from "@/features/invitations/guest";
import { demoContent, themes } from "@/lib/content";
export const metadata = {
  title: "Explore the invitation",
  robots: { index: false, follow: false },
};
export default async function Demo({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const { theme } = await searchParams;
  const selected = themes.find((t) => t === theme) || "royal";
  return <Guest content={{ ...demoContent, theme: selected }} mode="demo" />;
}
