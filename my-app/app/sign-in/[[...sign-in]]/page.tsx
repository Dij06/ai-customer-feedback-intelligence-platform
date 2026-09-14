import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-950 px-4 py-8">
      <SignIn
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}

