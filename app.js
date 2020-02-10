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
  const { urlToCheck } = req.body;

  run(urlToCheck)
    .then(function(result) {
      // send results json to frontend
      res.status(200).send({ analysisResults: result });
    })
    .catch(function(err) {
      console.err(err);
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
async function run(url) {
  console.log("Running test against " + url);
  //let t0 = performance.now();

  // get size of expected screenshot
  const expected = await readExpectedImage();

  // set headless to false if you want the browser to appear
  let browser = await puppeteer.launch({ headless: true });
  let page = await browser.newPage();

  // get matching screenshot
  await page.setViewport({ width: expected.width, height: expected.height });
  await page.goto(url);
  await autoScroll(page);
  await page.screenshot({
    path: actualImagePath,
    type: "png",
    fullPage: true
  });

  await page.close();
  await browser.close();

  let resizeComplete = await resizeImages();
  console.log(resizeComplete);

  let results = await compareScreenshots();

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

function readExpectedImage() {
  return new Promise((resolve, reject) => {
    const img1 = fs
      .createReadStream(expectedImagePath)
      .pipe(new PNG())
      .on("parsed", doneReading);

    function doneReading() {
      resolve(img1);
    }
  });
}

function resizeImages() {
  return new Promise((resolve, reject) => {
    const img1 = PNG.sync.read(fs.readFileSync(expectedImagePath));
    const img2 = PNG.sync.read(fs.readFileSync(actualImagePath));

    console.log("Resizing screenshots");
    // get largest width and height
    let widestWidth = Math.max(img1.width, img2.width);
    let tallestHeight = Math.max(img1.height, img2.height);

    // resize expected
    sharp(expectedImagePath)
      .resize(widestWidth, tallestHeight)
      .toFile(expectedResizedImagePath, function(err) {
        // resize actual, after expected has finished
        sharp(actualImagePath)
          .resize(widestWidth, tallestHeight)
          .toFile(actualResizedImagePath, function(err) {
            resolve("Resizing done");
          });
      });
  });
}

function compareScreenshots() {
  return new Promise((resolve, reject) => {
    const img1 = PNG.sync.read(fs.readFileSync(expectedResizedImagePath));
    const img2 = PNG.sync.read(fs.readFileSync(actualResizedImagePath));

    let widestWidth = Math.max(img1.width, img2.width);
    let tallestHeight = Math.max(img1.height, img2.height);

    // Do the visual diff.
    console.log("Comparing screenshots");
    const diff = new PNG({ width: widestWidth, height: tallestHeight });
    const numDiffPixels = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      img1.width,
      img2.height,
      { threshold: 0.2 }
    );
    console.log("Comparing done");

    const expectedTotalPixels = img1.width * img1.height;
    const percentageError = (numDiffPixels / expectedTotalPixels) * 100;
    const percentageAccuracy = 100 - percentageError;

    fs.writeFileSync(diffImagePath, PNG.sync.write(diff));

    const actualBase64 = fs.readFileSync(actualResizedImagePath, {
      encoding: "base64"
    });
    const diffBase64 = fs.readFileSync(diffImagePath, {
      encoding: "base64"
    });

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
