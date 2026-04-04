import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <h1 className="text-center text-[1.875rem] font-bold leading-tight tracking-tight text-[#0f172a]">
          Sign in
        </h1>
        <p className="mt-2 text-center text-base font-normal text-[#6b7280]">
          Enter your credentials to access TSS CRM
        </p>

        <LoginForm />
      </div>
    </main>
  );
}
