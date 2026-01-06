import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ImportOverframeClient } from "./import-overframe-client";

export const metadata = {
  title: "Import Test | ARSENYX",
  description: "Temporary page to test Overframe import.",
};

export default function ImportTestPage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Overframe Import Test
            </h1>
            <p className="text-muted-foreground">
              Paste an Overframe build URL and inspect the API response.
            </p>
          </div>

          <ImportOverframeClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
