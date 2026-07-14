import LoginPage from "@/components/login/login";
import { LoaderIcon } from "lucide-react";
import React, { Suspense } from "react";

const Login = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center">
          <LoaderIcon className="h-16 w-16 animate-spin" />
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
};
export default Login;

export const metadata = {
  title: "Login | Masjidhul Haadhi Accounting System",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};

