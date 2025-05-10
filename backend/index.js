const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const fs = require("fs"); // Import fs at the top
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());
// Initialize Google AI
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY }); // Ensure API Key is valid

const parsedContents = {}; // In-memory store for demo purposes
// Add root route handler
app.get("/", (req, res) => {
  res.json({ message: "PDF Analysis API is running" });
});

app.post("/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path; // Store path for cleanup

  try {
    // Read the file first to validate it's a PDF
    const dataBuffer = fs.readFileSync(filePath);

    // Basic PDF header validation
    const isPDF = dataBuffer.slice(0, 5).toString() === "%PDF-";
    if (!isPDF) {
      throw new Error("Invalid PDF file format");
    }

    let pdfData;
    try {
      pdfData = await pdfParse(dataBuffer, {
        max: 0, // Disable page limitation
        throwOnEmpty: true, // Throw error if PDF is empty
      });
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      if (pdfError.message.includes("bad XRef entry")) {
        throw new Error(
          "The PDF file appears to be corrupted or invalid. Please try with a different PDF file.",
        );
      }
      throw new Error(`Failed to parse PDF: ${pdfError.message}`);
    }

    if (!pdfData || !pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error("No text content found in the PDF");
    }

    const pdfText = pdfData.text;
    console.log(
      "Successfully extracted text from PDF:",
      pdfText.substring(0, 100) + "...",
    );

    // Construct the prompt for Google AI
    const prompt = `
    Analyze this content and segment it under meaningful headings.
    Format the response as a clean HTML fragment (do NOT include <html>, <head>, <body>, or <!DOCTYPE> tags).
    Do NOT wrap the output in markdown code fences (e.g., \`\`\`html).
    Return only the HTML content, using the following structure and components:

    Requirements:
    1. Use these Tailwind classes for headings:
       - Main headings: "text-2xl font-bold text-gray-900 mb-4"
       - Sub headings: "text-xl font-semibold text-gray-800 mb-3"
    2. Use these classes for paragraphs:
       - "text-gray-700 leading-relaxed mb-4"
    3. Use these classes for lists:
       - Lists: "list-disc pl-5 space-y-2 mb-4"
       - List items: "text-gray-700"
       // Use capitalized Motion components with these exact props:
          - Wrap each major section in <MotionDiv> with these exact props:
            initial='{"opacity": 0, "y": 20}'
            animate='{"opacity": 1, "y": 0}'
            transition='{"duration": 0.5}'
          - For nested animations, use <MotionSection> with:
            initial='{"opacity": 0}'
            animate='{"opacity": 1}'
            transition='{"delay": 0.2}'

       Example structure:
       <MotionDiv initial='{"opacity": 0, "y": 20}' animate='{"opacity": 1, "y": 0}' transition='{"duration": 0.5}' className="mb-8 space-y-4">
         <h1 class="text-2xl font-bold text-gray-900 mb-4">Title</h1>
         <MotionSection initial='{"opacity": 0}' animate='{"opacity": 1}' transition='{"delay": 0.2}' className="space-y-4">
           <p class="text-gray-700 leading-relaxed mb-4">Content</p>
         </MotionSection>
       </MotionDiv>

    Content to analyze:
    ${pdfText}
  `;

    // --- Corrected AI Call ---
    console.log("Sending request to Google AI...");
    const result = await ai.models.generateContent({
      // Use ai.models.generateContent
      model: "gemini-2.0-flash", // Specify the model here
      contents: [{ role: "user", parts: [{ text: prompt }] }], // Correct contents structure
    });
    // --- End Corrected AI Call ---

    console.log("Raw AI Result:", JSON.stringify(result, null, 2));

    if (!result) {
      // Check if the result object itself exists
      console.error("AI result is undefined.");
      throw new Error("Failed to get a valid result from AI.");
    }

    let generatedHtml = "";
    try {
      // Attempt to use the .text() helper directly on the result object
      // This is often the intended way to get aggregated text from candidates.
      generatedHtml = result.text();
    } catch (textError) {
      console.warn("result.text() failed, trying manual access:", textError);
      // Fallback: Manually access based on the KNOWN structure from your log
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        generatedHtml = result.candidates[0].content.parts[0].text;
      }
    }

    if (!generatedHtml) {
      // Check finishReason if available:
      const finishReason = result.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== "STOP") {
        console.error(
          "AI response was empty or content was blocked. Full Result:",
          JSON.stringify(result, null, 2),
        ); // Log full result
        throw new Error(
          `AI generation finished unexpectedly: ${finishReason}. Content might be blocked.`,
        );
      } else {
        console.error(
          "Failed to extract generated text from AI response. Full Result:",
          JSON.stringify(result, null, 2),
        ); // Log full result
        throw new Error("Failed to extract generated text from AI response.");
      }
    }

    // --- Remove Markdown Code Fences ---
    // The log shows the AI included ```html ... ```
    if (generatedHtml.startsWith("```html\n")) {
      generatedHtml = generatedHtml.substring(7); // Remove ```html\n
      if (generatedHtml.endsWith("\n```")) {
        generatedHtml = generatedHtml.substring(0, generatedHtml.length - 4); // Remove \n```
      } else if (generatedHtml.endsWith("```")) {
        generatedHtml = generatedHtml.substring(0, generatedHtml.length - 3); // Remove ```
      }
    }
    generatedHtml = generatedHtml.trim(); // Clean up any extra whitespace

    // --- Correction Ends Here ---

    console.log("Received response from Google AI.");
    console.log("Generated HTML:", generatedHtml); // Optional: Log generated HTML

    // Store the generated HTML content
    const id = Date.now().toString();
    parsedContents[id] = generatedHtml; // Store only the HTML string

    res.json({ id }); // Send back the ID
  } catch (error) {
    console.error("Error processing request:", error);

    let statusCode = 500;
    let errorMessage = "Internal server error";

    // Determine appropriate error message and status code
    if (error.message.includes("Invalid PDF file format")) {
      statusCode = 400;
      errorMessage = "Please upload a valid PDF file";
    } else if (error.message.includes("corrupted or invalid")) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes("No text content found")) {
      statusCode = 422;
      errorMessage =
        "The PDF file contains no extractable text. Please ensure the PDF has text content.";
    } else if (error.message.includes("Failed to parse PDF")) {
      statusCode = 400;
      errorMessage =
        "Unable to process the PDF file. Please try with a different file.";
    }

    res.status(statusCode).json({
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    // Clean up the uploaded file whether successful or not
    fs.unlink(filePath, (err) => {
      // Use async unlink
      if (err) {
        console.error("Error deleting uploaded file:", filePath, err);
      } else {
        // console.log("Successfully deleted uploaded file:", filePath); // Optional log
      }
    });
  }
});

app.get("/apps/:id", (req, res) => {
  const { id } = req.params;
  const htmlContent = parsedContents[id];
  if (!htmlContent) {
    return res.status(404).json({ error: "Content not found" });
  }
  res.json({ content: htmlContent });
});

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
