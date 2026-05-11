import type { Metadata } from "next";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Sign up — ECAMPUS Buzz",
  description: "Create your ECAMPUS Buzz account"
};

export default function SignupPage() {
  return <SignupForm />;
}
