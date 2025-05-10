# Doc2Link 

This app lets you upload a PDF file and get a summarized AI generated web app in a unique dynamic route. It uses distinct `/frontend` (Nextjs) and `/backend` (Expressjs) folders. Both need to be independently run using `npm run dev` command. First start the backend server and then the frontend server. 

## Overall workflow : 

You upload a PDF file. It is read using `formData` and passed on to the `/upload` endpoint in the `/backend/index.js` using a fetch api call. The /upload endpoint parses the pdf into text using pdParse and fs functions, then passes the parsed text to the Gemini LLM using a Google AI SDK function, alongwith a prompt to generate tailwind classes and shadcn components. It also directs to wrap each element in framer motion divs with animation props, but its not working yet. I need to debug it. The AI response is styled html and is stored in a variable `parsedContents[id]` where `id` is a unique slug created using date() function. the `id` is returned by the /upload endpoint to the feontend. 

Next, the router.push() function redirects to the /apps/[id]/page.tsx dynamic route. This is the template page. This page gives an API call to the `/apps/:id` backend endpoint which responds with the parsedContents[id] content. This is finally rendered by the /apps/[id]/page.tsx using separate MotionParser and ClientMotionParser wrapper component files which uses htmlParser function. 
