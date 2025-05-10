import ClientMotionParser from "@/components/ClientMotionParser";
import { Suspense } from "react";

export default async function AppPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  try {
    const res = await fetch(`http://localhost:5000/apps/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (!data.content) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Processing your document...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center p-6">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Document Analysis
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-Generated Content Structure
          </p>
        </header>

        {/* Main Content */}
        <div className="generated-content">
          <Suspense fallback={<div>Loading content...</div>}>
            <ClientMotionParser html={data.content} />
          </Suspense>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-gray-500 dark:text-gray-400 text-sm">
          © 2025 PDF Upload App
        </footer>
      </div>
    );
  } catch (error) {
    console.error("Error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-red-500">
          Error loading content: {(error as Error).message}
        </p>
      </div>
    );
  }
}
