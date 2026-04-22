import { SignUpForm } from "@/components/sign-up-form";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="bg-primary px-8 py-6 text-primary-foreground">
            <h1 className="text-2xl font-bold">Créer un compte</h1>
            <p className="mt-1 text-sm opacity-80">Gérez votre argent comme un pro</p>
          </div>
          <div className="px-8 py-6">
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
