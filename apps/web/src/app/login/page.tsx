import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — ECAMPUS Buzz",
  description: "Sign in to your ECAMPUS Buzz account"
};

export default function LoginPage() {
  return <LoginForm />;
}
