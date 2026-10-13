import { BrandShowcase } from "@/components/auth/BrandShowcase";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-[#FFF8F0] selection:bg-[#A81B1B] selection:text-white">
      <main className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-card border border-[#F3E7D8] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        <BrandShowcase />
        <RegisterForm />
      </main>
    </div>
  );
}
