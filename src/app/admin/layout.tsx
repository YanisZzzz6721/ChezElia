import type { Metadata } from "next";
import "@/styles/admin.css";

export const metadata: Metadata = {
  title: "Administration — Chez Elia",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="b-page adm">{children}</div>;
}
