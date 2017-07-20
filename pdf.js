const hummus = require('hummus');

const createAnnotation = (pdfWriter, annotation) => {
  const { position, content, color } = annotation;

  const [x1, y1, x2, y2] = position;

  var objectsContext = pdfWriter.getObjectsContext();
  const annotationObj = objectsContext.startNewIndirectObject();
  const dictionaryContext = objectsContext.startDictionary();

  dictionaryContext
    .writeKey('ANN')
    .writeNameValue('pdfmark')
    .writeKey('Type')
    .writeNameValue('Annot')
    .writeKey('Subtype')
    .writeNameValue('Highlight')
    .writeKey('Rect')
    .writeRectangleValue([x1, y1, x2, y2])
    .writeKey('Contents')
    .writeLiteralStringValue(new hummus.PDFTextString(content).toBytesArray())
    .writeKey('M') // modified time
    .writeLiteralStringValue(pdfWriter.createPDFDate(new Date()).toString())
    .writeKey('QuadPoints');

  objectsContext.startArray();
  objectsContext.writeNumber(x1);
  objectsContext.writeNumber(y2);
  objectsContext.writeNumber(x2);
  objectsContext.writeNumber(y2);
  objectsContext.writeNumber(x1);
  objectsContext.writeNumber(y1);
  objectsContext.writeNumber(x2);
  objectsContext.writeNumber(y1);
  objectsContext.endArray(hummus.eTokenSeparatorEndLine);

  dictionaryContext.writeKey('C');
  objectsContext.startArray();
  color.forEach(component => objectsContext.writeNumber(component));
  objectsContext.endArray(hummus.eTokenSeparatorEndLine);

  objectsContext.endDictionary(dictionaryContext).endIndirectObject();

  return annotationObj;
};

const modifyPage = (pdfWriter, pdfReader, copyingContext, pageIndex, annotations) => {
  const pageId = copyingContext.getSourceDocumentParser().getPageObjectID(pageIndex);
  const pageObject = copyingContext
    .getSourceDocumentParser()
    .parsePage(pageIndex)
    .getDictionary()
    .toJSObject();
  const objectsContext = pdfWriter.getObjectsContext();

  const annotationArray = annotations.map(annotation => createAnnotation(pdfWriter, annotation));

  objectsContext.startModifiedIndirectObject(pageId);
  const modifiedPageObject = pdfWriter.getObjectsContext().startDictionary();

  Object.getOwnPropertyNames(pageObject).forEach(element => {
    if (element !== 'Annots') {
      modifiedPageObject.writeKey(element);
      copyingContext.copyDirectObjectAsIs(pageObject[element]);
    }
  });

  // const pageDict = pdfReader.parsePageDictionary(pageIndex);
  // const annotsObject = pdfReader.queryDictionaryObject(pageDict, 'Annots');

  modifiedPageObject.writeKey('Annots');
  objectsContext.startArray();

  annotationArray.forEach(textObj => objectsContext.writeIndirectObjectReference(textObj));
  // annotsObject
  //   .toJSArray()
  //   .forEach(annot => objectsContext.writeIndirectObjectReference(annot.getObjectID()));

  objectsContext.endArray().endLine().endDictionary(modifiedPageObject).endIndirectObject();
};

const work = (annotations, inStream, outStream) => {
  const pdfWriter = hummus.createWriterToModify(inStream, outStream);
  const pdfReader = undefined;

  const copyingContext = pdfWriter.createPDFCopyingContextForModifiedFile();

  const drawAnnotations = annotations => {
    const groupedByPage = annotations.reduce((acc, annotation) => {
      acc[annotation.page] = acc[annotation.page] || [];
      acc[annotation.page].push(annotation);
      return acc;
    }, {});

    Object.keys(groupedByPage).map(Number).sort((a, b) => a - b).forEach(pageIndex => {
      modifyPage(pdfWriter, pdfReader, copyingContext, pageIndex, groupedByPage[String(pageIndex)]);
    });
  };

  drawAnnotations(annotations);

  pdfWriter.end();
};

module.exports = { createAnnotation, modifyPage, work };
