"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Add this line
  const router = useRouter();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    // Validate file size (e.g., max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert("File is too large. Please upload a PDF smaller than 10MB");
      return;
    }

    setIsLoading(true); // Add this line
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/apps/${data.id}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);

      let errorMessage = "Failed to upload file";
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.request) {
        // Request made but no response
        errorMessage = "Server not responding. Please try again later.";
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">PDF to Link</h1>
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="myfile"
          className="px-5 py-2 bg-black text-white rounded-full border border-gray-700 hover:bg-gray-500 transition hover:cursor-pointer"
        >
          Select PDF
        </label>
        <input
          id="myfile"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        <br />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-gray-700 hover:bg-gray-500 text-white font-semibold py-2 px-4 mt-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </div>
          ) : (
            "Upload PDF"
          )}
        </button>
      </form>
    </div>
  );
}
