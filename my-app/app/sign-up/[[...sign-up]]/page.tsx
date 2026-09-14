import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-950 px-4 py-8">
      <SignUp
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
        signInUrl="/sign-in"
      />
    </div>
  );
}

