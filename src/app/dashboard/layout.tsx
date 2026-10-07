import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { cookies } from "next/headers";
import { OwnerLanguage } from "@/components/owner-language";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await currentUser())) redirect("/sign-in");
  return (
    <OwnerLanguage
      initial={
        (await cookies()).get("owner-language")?.value === "gu" ? "gu" : "en"
      }
    >
      {children}
    </OwnerLanguage>
  );
}
