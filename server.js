const http = require('http');
const urlTools = require('url');
const fs = require('fs');
const path = require('path');

const hummus = require('hummus');

const PDFRStreamForBuffer = require('./PDFRStreamForBuffer');

const { work } = require('./pdf');

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200);
    fs.createReadStream('index.html').pipe(res);
    return;
  }

  let annotations = [];

  try {
    const urlObject = urlTools.parse(req.url, true);
    annotations = JSON.parse(urlObject.query.annotations);
  } catch (e) {
    res.end('Fail');
  }

  let body = [];

  req
    .on('data', chunk => {
      body.push(chunk);
    })
    .on('end', () => {
      body = Buffer.concat(body);
      console.log('Got buffer');

      const inStream = new PDFRStreamForBuffer(body);
      const outStream = new hummus.PDFStreamForResponse(res);

      console.log('Working...');
      work(annotations, inStream, outStream);

      console.log('Done');
      res.end();
    });
});

const hostname = '127.0.0.1';
const port = 3000;

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
