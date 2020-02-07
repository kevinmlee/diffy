import React, { Component } from "react";
import axios from "axios";

import Input from "../views/input";
import Results from "../views/results";

export default class Main extends Component {
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

    this.uploadExpectedResult = this.uploadExpectedResult.bind(this);
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
    await this.uploadExpectedResult();
    await this.processImages();
  }

  reset = () => {
    this.setState({ resultsReceived: false });
    this.setState({ url: "" });
    this.setState({ expectedImage: null });
    this.setState({ expectedImageBase64: null });
    this.setState({ actualImageBase64: null });
    this.setState({ diffImageBase64: null });
  };

  onDrop = file => {
    console.log(file[0]);
    this.setState({ expectedImage: file[0] });
    this.setState({ expectedImageName: file[0].name });

    let myReader = new FileReader();
    myReader.onloadend = e => {
      this.setState({ expectedImageBase64: myReader.result });
    };
    myReader.readAsDataURL(this.state.expectedImage);
  };

  uploadExpectedResult = () => {
    return new Promise((resolve, reject) => {
      let myReader = new FileReader();
      myReader.onloadend = e => {
        //this.setState({ expectedImageBase64: myReader.result });

        axios
          .post("/api/uploadExpectedResult", {
            imageBase64String: myReader.result
          })
          .then(
            response => {
              //console.log("repsonse: ", response);
              resolve("Upload complete");
            },
            error => {
              console.log(error);
            }
          );
      };
      myReader.readAsDataURL(this.state.expectedImage);
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

            /*
            this.setState(prevState => ({
              processedResults: {
                ...prevState.processedResults,
                error: data.error
              }
            }));

            this.setState(prevState => ({
              processedResults: {
                ...prevState.processedResults,
                accuracy: data.accuracy
              }
            }));
            */
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
