import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { GalleryVerticalEnd } from "lucide-react";

import { RegisterForm } from "~/components/register-form";
import Link from "next/link";

export default async function RegisterPage() {
  const supabase = createServerComponentClient({ cookies });
  const user = await supabase.auth.getUser();

  if (user.data.user) {
    // If the user is already logged in, redirect to the home page
    return redirect("/dashboard");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Neolead
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
