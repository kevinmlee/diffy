import React, { Component } from "react";
import axios from "axios";

// components
import Input from "../views/input";
import Results from "../views/results";

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displayProcessingModal: false,
      displayErrorModal: false,
      errorMessage: "",
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
      metrics: null,
      processedLinks: null,
      resultsReceived: false
    };

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

  async handleSubmit(event) {
    this.setState({ displayProcessingModal: true });
    await this.processImages(this.state.url);
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
    //console.log(event.target.files[0]);
    this.setState({ expectedImage: event.target.files[0] });

    let reader = new FileReader();
    reader.onloadend = e => {
      this.setState({ expectedImageBase64: reader.result });
    };
    if (event.target.files[0]) {
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  processImages = url => {
    return new Promise((resolve, reject) => {
      axios
        .post("http://localhost:5000/api/processImages", {
          urlToCheck: url,
          expectedImageBase64String: this.state.expectedImageBase64
        })
        .then(
          response => {
            if (!response.data.error) {
              let data = response.data.analysisResults;
              console.log("results: ", data);

              this.setState({ error: data.error });
              this.setState({ accuracy: data.accuracy });
              //this.setState({ expectedImageBase64: data.expectedImageBase64 });
              this.setState({ actualImageBase64: data.actualImageBase64 });
              this.setState({ diffImageBase64: data.diffImageBase64 });
              //this.setState({ timeToComplete: data.timeToComplete });
              this.setState({ performanceMetrics: data.performance });
              this.setState({ processedLinks: data.processedLinks });
              this.setState({ resultsReceived: true });
              this.setState({ displayProcessingModal: false });

              console.log(this.state.processedLinks);
            } else {
              //console.log(response.data.error);
              this.setState({ displayProcessingModal: false });
              this.setState({ errorMessage: response.data.error });
              this.setState({ displayErrorModal: true });
            }
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
          <div className="description">This may take up to a minute.</div>

          <div className="loader loader-1">
            <div className="loader-outter"></div>
            <div className="loader-inner"></div>
          </div>
        </div>
      </div>
    );
  };

  displayErrorModal = e => {
    return (
      <div
        id="error"
        className={this.state.displayErrorModal ? "modal" : "modal hidden"}
      >
        <div className="modal-content">
          <div className="icon">
            <img src="./assets/icons8-error-64.png" alt="error icon" />
          </div>
          <div className="title">Error</div>
          <div className="description">{this.state.errorMessage}</div>

          <button
            className="btn gradient c-white"
            onClick={this.closeErrorModal}
          >
            <span>Understood</span>
          </button>
        </div>
      </div>
    );
  };

  closeErrorModal = e => {
    this.setState({ displayErrorModal: false });
  };

  render() {
    const processingModal = this.displayProcessingModal();
    const errorModal = this.displayErrorModal();

    return (
      <div>
        {processingModal}
        {errorModal}

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
