import React, { Component } from "react";
import axios from "axios";

// components
import Input from "../views/input";
import Results from "../views/results";

const fs = require("fs");
const PNG = require("pngjs").PNG;
const puppeteer = require("puppeteer"); // headless chrome
const pixelmatch = require("pixelmatch"); // image diffing
const { performance } = require("perf_hooks");
const sharp = require("sharp"); // image resizer

// image paths
const expectedImagePath = __dirname + "/client/expected/expected.png";
const expectedResizedImagePath =
  __dirname + "/client/expected/expected-resized.png";
const actualImagePath = __dirname + "/client/actual/actual.png";
const actualResizedImagePath = __dirname + "/client/actual/actual.png";
const diffImagePath = __dirname + "/client/result/diff.png";

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displayProcessingModal: false,
      url: "",
      expectedImage: null,
      expectedImageBase64: null,
      actualImageBase64: null,
      diffImageBase64: null,
      processedResults: {
        expectedPixels: 123456,
        differenceOfPixels: 10,
        error: 0,
        accuracy: 0
      },
      error: 0,
      accuracy: 0,
      timeToComplete: 0,
      resultsReceived: false
    };

    this.saveExpectedResult = this.saveExpectedResult.bind(this);
    this.processImages = this.processImages.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.reset = this.reset.bind(this);
  }

  // saves input into local variables
  handleChange = event => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  // on submit, attempt to authenticate with Tesla
  async handleSubmit(event) {
    this.setState({ displayProcessingModal: true });
    await this.saveExpectedResult();
    //await this.processImages();
  }

  reset = () => {
    this.setState({ resultsReceived: false });
    this.setState({ url: "" });
    this.setState({ expectedImage: null });
    this.setState({ expectedImageBase64: null });
    this.setState({ actualImageBase64: null });
    this.setState({ diffImageBase64: null });
  };

  onDrop = event => {
    console.log(event.target.files[0]);
    this.setState({ expectedImage: event.target.files[0] });

    let reader = new FileReader();
    reader.onloadend = e => {
      this.setState({ expectedImageBase64: reader.result });
    };
    if (event.target.files[0]) {
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  saveExpectedResult = () => {
    return new Promise((resolve, reject) => {
      let myReader = new FileReader();
      myReader.onloadend = e => {
        let imageBase64String = myReader.result;
        let data = imageBase64String.replace(/^data:image\/\w+;base64,/, "");
        let buf = new Buffer(data, "base64");

        fs.writeFile(expectedImagePath, buf, function(err) {
          if (err) throw err;
          else {
            console.log("Image saved");
            resolve();
          }
        });
      };
      if (this.state.expectedImage) {
        myReader.readAsDataURL(this.state.expectedImage);
      }
    });
  };

  processImages = () => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/processImages", {
          urlToCheck: this.state.url
        })
        .then(
          response => {
            let data = response.data.analysisResults;
            //console.log("results: ", data);

            this.setState({ error: data.error });
            this.setState({ accuracy: data.accuracy });
            this.setState({ actualImageBase64: data.actualImageBase64 });
            this.setState({ diffImageBase64: data.diffImageBase64 });
            this.setState({ timeToComplete: data.timeToComplete });
            this.setState({ resultsReceived: true });
            this.setState({ displayProcessingModal: false });
          },
          error => {
            console.log(error);
          }
        );
    });
  };

  displayProcessingModal = e => {
    return (
      <div
        id="processing"
        className={this.state.displayProcessingModal ? "modal" : "modal hidden"}
      >
        <div className="modal-content">
          <div className="title">Processing data</div>
          <div className="description">This may up to a minute.</div>

          <div class="loader loader-1">
            <div class="loader-outter"></div>
            <div class="loader-inner"></div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const processingModal = this.displayProcessingModal();
    return (
      <div>
        {processingModal}

        {this.state.resultsReceived ? (
          <Results state={this.state} reset={this.reset} />
        ) : (
          <Input
            state={this.state}
            handleChange={this.handleChange}
            handleSubmit={this.handleSubmit}
            onDrop={this.onDrop}
          />
        )}
      </div>
    );
  }
}

/*
import React, { Component } from "react";
import api from "../helpers/api";

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = { name: "Test" };
    this.handleInput = this.handleInput.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  componentDidMount() {
    // Do something when loaded
  }

  handleInput(e) {
    this.setState({ name: e.target.value });
  }

  handleSearch(e) {
    e.preventDefault();
    this.setState({ name: e.target.value });
    api.getThing().then(data => {
      console.log(data);
    });
  }

  render() {
    const { name } = this.state;

    return (
      <div className="container text-center">
        <h2>username: {name}</h2>

        <form className="search" onSubmit={this.handleSearch}>
          <input
            onChange={this.handleInput}
            type="search"
            placeholder="Search"
          />
          <button type="submit" className="btn">
            Test
          </button>
        </form>

        <div className="bg-test" />
        <img src="assets/apple-icon.png" width="100" alt="Black box" />
      </div>
    );
  }
}

export default Home;
*/
