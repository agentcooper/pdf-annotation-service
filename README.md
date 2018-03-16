### pdf-annotation-service

This is proof-of-concept for embedding highlights into PDF documents.

##### How it works:
1. Client-side code fetches the PDF from arxiv.org (client-side)
2. Client-side code pushes PDF as binary data to the server, together with coordinates for highlights
3. Server code embeds the highlights into the PDF document
4. Server code sends data back to the client

#### How to run

```
npm install
npm start
open http://localhost:3000
```

<img src="github/screenshot.png">
