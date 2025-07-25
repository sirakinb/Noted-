"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Button } from "./ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
import { ModalCustomApiKey } from "./hooks/ModalCustomApiKey";
import { toast } from "sonner";
import { useTogetherApiKey } from "./TogetherApiKeyProvider";
import { useLimits } from "./hooks/useLimits";

export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const [mounted, setMounted] = React.useState(false);
  const { apiKey } = useTogetherApiKey();

  const isBYOK = !!apiKey;

  const { transformationsData, isLoading } = useLimits();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // /whispers/1234567890
  const isSingleWhisperPage =
    pathname.startsWith("/whispers/") && pathname.length > 11;

  if (!mounted) {
    // Optionally, you can return a skeleton or null while mounting
    return (
      <div className="h-[63px] w-full bg-gray-50 border-b border-gray-200" />
    );
  }

  return (
    <header className="min-h-[32px] flex items-center justify-between p-0.5 bg-gray-50 border-b border-gray-200">
      {isSingleWhisperPage ? (
        <Link href="/whispers/" className="flex items-center gap-2">
          <img
            src="/back.svg"
            className="min-w-[14px] min-h-[14px] size-[14px]"
          />
          <span className="text-base font-medium text-[#4A5565]">
            My Notes
          </span>
        </Link>
      ) : (
        <Link
          href={user?.id ? "/whispers/" : "/"}
          className="flex items-center gap-2"
        >
          <img
            src="/noted__logo.png"
            alt="Noted"
            className="h-32 w-auto"
          />
        </Link>
      )}
      <div className="flex items-center gap-2">
        <SignedOut>
          <SignInButton>
            <Button variant="ghost">Login</Button>
          </SignInButton>
          <SignUpButton>
            <Button className="font-medium">Sign up</Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link href="/subscribe">
            <Button 
              variant="outline" 
              className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 hover:from-blue-700 hover:to-indigo-700"
            >
              Subscribe
            </Button>
          </Link>
          <Button
            className="w-[51px] h-[30px] relative rounded-lg bg-white hover:bg-gray-50 border-[0.5px] border-gray-200"
            onClick={() => {
              if (!isLoading) {
                toast(
                  `You got ${
                    transformationsData?.remaining ?? 0
                  } transformations left for your notes`
                );
              }
            }}
          >
            <img src="/spark.svg" className="size-4 min-w-4" />
            <p className="text-sm font-medium text-left text-[#1e2939]">
              {isLoading
                ? "..."
                : transformationsData?.remaining ?? 0}
            </p>
          </Button>
          <UserButton
            appearance={{
              elements: {
                avatarBox: {
                  img: "rounded-[8px]",
                },
              },
            }}
          />
        </SignedIn>
      </div>
      <ModalCustomApiKey />
    </header>
  );
}
