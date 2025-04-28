const express = require('express');
   const multer = require('multer');
   const pdfParse = require('pdf-parse');
   const cors = require('cors');

   const app = express();
   const upload = multer({ dest: 'uploads/' });
   app.use(cors());

   const parsedContents = {};

   app.post('/upload', upload.single('pdf'), async (req, res) => {
     if (!req.file) {
       return res.status(400).json({ error: 'No file uploaded' });
     }

     try {
       const dataBuffer = require('fs').readFileSync(req.file.path);
       const pdfData = await pdfParse(dataBuffer);
       const id = Date.now().toString();
       parsedContents[id] = pdfData.text;

       res.json({ id });
     } catch (error) {
       res.status(500).json({ error: 'Error parsing PDF' });
     }
   });

   app.get('/apps/:id', (req, res) => {
     const { id } = req.params;
     const content = parsedContents[id];
     if (!content) {
       return res.status(404).json({ error: 'Content not found' });
     }
     res.json({ content });
   });

   app.listen(5000, () => {
     console.log('Backend running on http://localhost:5000');
   });