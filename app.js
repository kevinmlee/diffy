const express = require("express");
const path = require("path");
const logger = require("morgan");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const PNG = require("pngjs").PNG;
const puppeteer = require("puppeteer"); // headless chrome
const pixelmatch = require("pixelmatch"); // image diffing
//const { performance } = require("perf_hooks");
const sharp = require("sharp"); // image resizer

const app = express();

// Image paths
const expectedImagePath = __dirname + "/expected.png";
const expectedResizedImagePath = __dirname + "/expected-resized.png";
const actualImagePath = __dirname + "/actual.png";
const actualResizedImagePath = __dirname + "/actual.png";
const diffImagePath = __dirname + "/diff.png";

// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(logger("dev"));
app.use(cors());
app.options("*", cors());

/////////////////////////////////////////////
// API
/////////////////////////////////////////////

// Serve static files from the React app
// app.use(express.static(path.join(__dirname, "client/build")));
app.use(express.static(path.join(__dirname, "public")));

app.all("/api/saveExpectedResult", (req, res) => {
  const { imageBase64String } = req.body;

  console.log("Received request");

  // Grab the extension to resolve any image error
  // var ext = imageBase64String.split(";")[0].match(/jpeg|png|gif/)[0];

  // TO-DO
  // convert jpg to png

  // strip off the data: url prefix to get just the base64-encoded bytes
  var data = imageBase64String.replace(/^data:image\/\w+;base64,/, "");
  var buf = new Buffer(data, "base64");
  fs.writeFile(expectedImagePath, buf, function(err) {
    if (err) throw err;
    else {
      console.log("Image saved");
      res.status(200).send({ success: "Received expected result." });
    }
  });
});

app.all("/api/processImages", (req, res) => {
  const { urlToCheck, expectedImageBase64String } = req.body;

  run(urlToCheck, expectedImageBase64String)
    .then(function(result) {
      // send results json to frontend
      res.status(200).send({ analysisResults: result });
    })
    .catch(function(err) {
      throw err;
    });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/public/index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`Diffy listening on ${port}`);

// Helpers
async function run(url, expectedImageBase64String) {
  console.log("Running test against " + url);
  //let t0 = performance.now();

  // get size of expected screenshot
  const expected = await readImage(expectedImageBase64String);
  console.log("expected", { width: expected.width, height: expected.height });

  // set headless to false if you want the browser to appear
  let browser = await puppeteer.launch({ headless: true });
  let page = await browser.newPage();

  // get matching screenshot
  await page.setViewport({ width: expected.width, height: expected.height });
  await page.goto(url);
  await autoScroll(page);
  let actualBase64String = await page.screenshot({
    type: "png",
    fullPage: true,
    encoding: "base64"
  });
  //console.log("actualBase64String", actualBase64String);
  const actual = await readImage(actualBase64String);
  console.log("actual", { width: actual.width, height: actual.height });

  await page.close();
  await browser.close();

  //
  // Resize screenshots
  //
  console.log("Resizing screenshots");

  // get largest width and height
  let widestWidth = Math.max(expected.width, actual.width);
  let tallestHeight = Math.max(expected.height, actual.height);

  let expectedData = expectedImageBase64String.replace(
    /^data:image\/\w+;base64,/,
    ""
  );
  const expectedBuffer = new Buffer(expectedData, "base64");

  let actualData = actualBase64String.replace(/^data:image\/\w+;base64,/, "");
  const actualBuffer = new Buffer(actualData, "base64");

  console.log("max dimensions: ", {
    width: widestWidth,
    height: tallestHeight
  });

  // resized expected
  const expectedResizedBuffer = await sharp(expectedBuffer)
    .resize(widestWidth, tallestHeight)
    .png()
    .toBuffer();

  // resize actual
  const actualResizedBuffer = await sharp(actualBuffer)
    .resize(widestWidth, tallestHeight)
    .png()
    .toBuffer();

  const expectedResized = new PNG({ filterType: 4 }).parse(
    expectedResizedBuffer,
    function(error, data) {
      //console.log(error, data);
    }
  );
  const actualResized = new PNG({ filterType: 4 }).parse(
    actualResizedBuffer,
    function(error, data) {
      //console.log(error, data);
    }
  );

  console.log("expected resized", {
    width: expectedResized.width,
    height: expectedResized.height
  });
  console.log("actual resized", {
    width: actualResized.width,
    height: actualResized.height
  });

  let results = await compareScreenshots(
    expectedResizedBuffer,
    actualResizedBuffer
  );

  /*
  // calculate runtime
  let t1 = performance.now();
  let runtime = t1 - t0;
  let runtimeInSeconds = runtime / 1000;

  // add runtime to results json that we got from compareScreenshots
  results["timeToComplete"] = runtimeInSeconds;
  */

  return results;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    }).then();
  });
}

function readImage(base64String) {
  return new Promise((resolve, reject) => {
    let data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = new Buffer(data, "base64");

    const img1 = new PNG({ filterType: 4 }).parse(imgBuffer, function(
      error,
      data
    ) {
      //console.log(error, data);
    });

    resolve(img1);
  });
}

function compareScreenshots(expectedResizedBuffer, actualResizedBuffer) {
  return new Promise((resolve, reject) => {
    // read buffers into PNGs
    const expectedResized = PNG.sync.read(expectedResizedBuffer);
    const actualResized = PNG.sync.read(actualResizedBuffer);

    let widestWidth = Math.max(expectedResized.width, actualResized.width);
    let tallestHeight = Math.max(expectedResized.height, actualResized.height);

    // Do the visual diff.
    console.log("Comparing screenshots");
    const diff = new PNG({ width: widestWidth, height: tallestHeight });

    const numDiffPixels = pixelmatch(
      expectedResized.data,
      actualResized.data,
      diff.data,
      expectedResized.width,
      actualResized.height,
      { threshold: 0.2 }
    );
    console.log("Comparing done");

    const expectedTotalPixels = expectedResized.width * expectedResized.height;
    const percentageError = (numDiffPixels / expectedTotalPixels) * 100;
    const percentageAccuracy = 100 - percentageError;

    // convert data into base64string
    const actualBase64 = actualResizedBuffer.toString("base64");
    //console.log("actualBase64", actualBase64);

    const diffBase64 = PNG.sync.write(diff).toString("base64");
    //console.log("diffBase64", diffBase64);

    resolve({
      expectedPixels: expectedTotalPixels,
      differenceOfPixels: numDiffPixels,
      error: percentageError,
      accuracy: percentageAccuracy,
      actualImageBase64: actualBase64,
      diffImageBase64: diffBase64
    });
  });
}
