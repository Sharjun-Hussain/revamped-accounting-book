"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import * as z from "zod";

// Icons
import { Loader2, Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";


// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// --- Configuration: Solid Islamic Emerald Theme ---
const THEME_COLOR = "#046c4e"; // Deep Emerald Green
const THEME_LIGHT = "#def7ec"; // Very light green for backgrounds
const THEME_HOVER = "#03543f"; // Darker green for hover

// --- Validation Schema ---
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().default(false),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values) {
    setGlobalError(null);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setGlobalError("Invalid email or password.");
        form.setValue("password", "");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setGlobalError("Connection error. Please try again.");
    }
  }

  const handleSocialLogin = (provider) => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    // MAIN CONTAINER: White background for cleanliness
    <div className="min-h-dvh w-full lg:grid lg:grid-cols-2 bg-white font-sans text-slate-900">
      {/* ---------------- LEFT SIDE: Islamic Pattern & Branding ---------------- */}
      <div
        className="relative hidden h-full flex-col p-10 text-white lg:flex"
        style={{ backgroundColor: THEME_COLOR }}
      >
        {/* CSS-Only Islamic Geometric Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${THEME_LIGHT} 2px, transparent 2px), radial-gradient(${THEME_LIGHT} 2px, transparent 2px)`,
            backgroundSize: "32px 32px",
            backgroundPosition: "0 0, 16px 16px",
          }}
        />

        {/* Logo Area */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="relative h-12 w-12 bg-white/10 rounded-full p-2 flex items-center justify-center border border-white/20">
            <Image
              src="/assets/images/hadhi-logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Majidhul Haadhi
          </span>
        </div>

        {/* Center Visual (Optional: You can put a mosque vector or just text here) */}
        <div className="flex-1 flex items-center justify-center relative z-20">
          <div className="space-y-4 text-center max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Manage your finances with{" "}
              <span className="text-[#6ee7b7]">Ehsan</span>
            </h2>
            <p className="text-emerald-100/80 text-lg">
              Excellence in accounting, transparency in records.
            </p>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="relative z-20 mt-auto border-t border-emerald-400/30 pt-6">
          <blockquote className="space-y-2">
            <p className="text-lg italic text-emerald-50">
              &ldquo;Verily, Allah commands you to render trusts to whom they
              are due.&rdquo;
            </p>
            <footer className="text-sm font-semibold text-emerald-200">
              Surah An-Nisa 4:58
            </footer>
          </blockquote>
        </div>
      </div>

      {/* ---------------- RIGHT SIDE: Clean White Form ---------------- */}
      <div className="flex items-center justify-center p-8 bg-slate-50/50">
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Sign In
            </h1>
            <p className="text-sm text-slate-500">
              Welcome back to your accounting book
            </p>
          </div>

          <div className="grid gap-6">
            {/* Global Error */}
            {globalError && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-100 text-center">
                {globalError}
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="name@example.com"
                            {...field}
                            className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-offset-0 transition-all"
                            style={{
                              "--tw-ring-color": THEME_COLOR,
                              // Custom active border color
                              borderColor: "inherit",
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-offset-0 transition-all"
                            style={{ "--tw-ring-color": THEME_COLOR }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            // Custom color override for checkbox
                            className="border-slate-300 data-[state=checked]:border-none text-white"
                            style={{
                              backgroundColor: field.value
                                ? THEME_COLOR
                                : "transparent",
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium text-slate-600 cursor-pointer">
                          Remember me
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold hover:underline"
                    style={{ color: THEME_COLOR }}
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button - Solid Color */}
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full h-11 text-white font-bold text-base shadow-sm hover:opacity-90 transition-all mt-2"
                  style={{ backgroundColor: THEME_COLOR }}
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Sign In <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-50 px-2 text-slate-500">
                  Or continue with
                </span>
              </div>
            </div>

           

            <p className="px-8 text-center text-sm text-slate-500 mt-4">
              By clicking continue, you agree to our{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-slate-900"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-slate-900"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}