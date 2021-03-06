const express = require("express");
const path = require("path");
const logger = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const PNG = require("pngjs").PNG;
const puppeteer = require("puppeteer"); // headless chrome
const pixelmatch = require("pixelmatch"); // image diffing
//const { performance } = require("perf_hooks");
const sharp = require("sharp"); // image resizer

const app = express();

/*
 * Settings
 */

// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(logger("dev"));
app.use(cors());
app.options("*", cors());

/*
 * API
 */

// Serve static files from the React app
// app.use(express.static(path.join(__dirname, "client/build")));
app.use(express.static(path.join(__dirname, "public")));

app.all("/api/processImages", async (req, res) => {
  const { urlToCheck, expectedImageBase64String } = req.body;

  // check if URL exists
  // const activeURL = await checkURL(urlToCheck);
  const activeURL = await testURL(urlToCheck);
  const baseURL = urlToCheck.match(/^https?:\/\/[^#?\/]+/)[0];

  // const isJPG = expectedImageBase64String.includes("data:image/jpeg");
  // convert image to png
  console.log("Converting expected image to PNG");
  const base64Data = expectedImageBase64String.replace(
    /^data:image\/\w+;base64,/,
    ""
  );
  const base64Buffer = new Buffer(base64Data, "base64");
  const base64PNGBuffer = await sharp(base64Buffer)
    .png()
    .toBuffer();

  console.log("Conversion complete");
  const expectedBase64PNG = base64PNGBuffer.toString("base64");

  // if URL exists then run tests, otherwise send error back to frontend
  if (activeURL) {
    run(urlToCheck, baseURL, expectedBase64PNG)
      .then(function(result) {
        // send results json to frontend
        res.status(200).send({ analysisResults: result });
      })
      .catch(function(err) {
        throw err;
      });
  } else {
    res.send({
      error: "Please check the URL and try again."
    });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/public/index.html"));
});

/*
 *  Start server and listen
 */
const port = process.env.PORT || 5000;
app.listen(port);

console.log(`Diffy listening on ${port}`);

/*
 * Helper functions
 */

async function run(url, baseURL, expectedImageBase64String) {
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

  // Captures the current state of the accessibility tree
  // const accessibility = await page.accessibility.snapshot();
  // console.info(accessibility);

  // Executes Navigation API within the page context
  const metrics = await page.evaluate(() => JSON.stringify(window.performance));

  // Parses the result to JSON
  console.info(JSON.parse(metrics));

  /*
  // Get all links on current page and store them in an array
  let anchors = document.getElementsByTagName("a");
  let anchorsArray = new Array();
  for (let i = 0, max = anchors.length; i < max; i++) {
    //console.log(anchors[i].href);
    anchorsArray.push(anchors[i].href);
  }
  console.log(anchorsArray);
  */

  // Get all links on current page and store them in an array
  let hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"), a =>
      a.getAttribute("href")
    )
  );
  // remove first element
  hrefs.shift();
  //console.log("hrefs", hrefs);

  // add base url to relative links
  hrefs.forEach((element, index) => {
    if (element[0] === "/") hrefs[index] = baseURL + element;
  });

  //console.log("edited hrefs", hrefs);

  // Check for broken links and store them in an array
  let processedLinks = await testLinks(hrefs);

  /*
  let brokenLinks = new Array();
  for (let i = 0, max = hrefs.length; i < max; i++) {
    //let testResult = await testURL(hrefs[i]);
    //console.log(hrefs[i] + testResult);

    urlExists(hrefs[i], function(err, exists) {
      console.log(hrefs[i] + " " + exists);

      if (!exists) brokenLinks.push(hrefs[i]);
    });
  }
  */
  console.log("processed links", processedLinks);

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

  // add metrics to results json
  results["performance"] = JSON.parse(metrics);
  //results["processedLinks"] = JSON.parse(processedLinks);
  results["processedLinks"] = processedLinks;

  //console.log(results);

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
    // const expectedBase64 = expectedResizedBuffer.toString("base64");
    const actualBase64 = actualResizedBuffer.toString("base64");
    const diffBase64 = PNG.sync.write(diff).toString("base64");

    resolve({
      expectedPixels: expectedTotalPixels,
      differenceOfPixels: numDiffPixels,
      error: percentageError,
      accuracy: percentageAccuracy,
      //expectedImageBase64: expectedBase64,
      actualImageBase64: actualBase64,
      diffImageBase64: diffBase64
    });
  });
}

testLinks = async links => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let processedLinks = {};
  let failedLinks = new Array();
  let passedLinks = new Array();
  let emptyLinks = 0;
  let result;

  //console.log(links);

  for (let i = 0, max = links.length; i < max; i++) {
    if (
      links[i] === "#" ||
      links[i] === "javascript:void(0)" ||
      links[i] === "javascript:;"
    )
      emptyLinks++;
    else {
      //console.log("Testing " + links[i]);
      result = await page.goto(links[i]);

      //console.log(result.status());
      if (result && result.status() === 200)
        passedLinks.push({ status: 200, url: links[i] });
      else failedLinks.push({ status: 404, url: links[i] });
    }
  }

  await page.close();
  await browser.close();

  processedLinks["failed"] = failedLinks;
  processedLinks["empty"] = emptyLinks;
  processedLinks["passed"] = passedLinks;

  return processedLinks;
};

testURL = async url => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let response = await page.goto(url);
  //console.log(response.status() + " : " + url);

  await page.close();
  await browser.close();

  return response.status() === 200 ? true : false;
};
