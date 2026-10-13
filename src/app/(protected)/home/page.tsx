import { cookies } from "next/headers";
import { HomeContent } from "@/components/home/HomeContent";
import { UserModel } from "@/types/user";

export const instant = false;

export default async function HomePage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("pot_user")?.value;
  let initialUser: UserModel | null = null;

  if (userCookie) {
    try {
      initialUser = JSON.parse(decodeURIComponent(userCookie)) as UserModel;
    } catch {
      initialUser = null;
    }
  }

  return <HomeContent initialUser={initialUser} />;
}
