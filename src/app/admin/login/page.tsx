import { LoginForm } from "@/components/admin/LoginForm";

export default function LoginPage() {
  return (
    <main className="adm-login">
      <p className="adm-brand">Chez Elia</p>
      <h1 className="adm-h1">Administration</h1>
      <LoginForm />
    </main>
  );
}
