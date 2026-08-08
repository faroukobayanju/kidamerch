import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminLogin } from "@/components/admin/AdminShell";
import { useData } from "@/lib/data-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — KIDA" },
      {
        name: "description",
        content:
          "Operational console for the KIDA catalogue: products, orders, inventory and customers.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Console — KIDA" },
      {
        property: "og:description",
        content: "Manage catalogue, orders, inventory and customers.",
      },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { ready, isAdmin } = useData();
  if (!ready) return <div className="min-h-screen bg-surface-2" />;
  if (!isAdmin) return <AdminLogin />;
  return <Outlet />;
}
