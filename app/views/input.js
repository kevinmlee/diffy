import React, { Component } from "react";
//import Dropzone from "react-dropzone";

export default class Input extends Component {
  constructor(props) {
    super(props);

    this.displayBubbles = this.displayBubbles.bind(this);
  }

  displayBubbles = e => {
    return (
      <ul className="bg-bubbles">
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
      </ul>
    );
  };

  render() {
    const bubbles = this.displayBubbles();

    return (
      <div id="input" className="bubbles-bg ta-center">
        {bubbles}

        <div className="container">
          <div className="section-header">
            <h2 className="section-title c-white">diffy</h2>
            <div className="section-copy"></div>
          </div>

          <div className="form-container">
            <div className="row">
              <input
                type="text"
                name="url"
                placeholder="URL"
                value={this.props.state.url}
                onChange={this.props.handleChange}
                required
              />
            </div>
            <div className="row">
              <input
                label="Image"
                type="file"
                name="image"
                accept=".png"
                onChange={this.props.onDrop}
                required
              />
            </div>
            <div className="row">
              <input
                type="submit"
                className="btn c-black bg-white-opaque h-bg-white"
                value="Process"
                onClick={this.props.handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/*
import React, { Component } from "react";
import Dropzone from "react-dropzone";

export default class Input extends Component {
  render() {
    return (
      <div id="input" className="ta-center">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Input</h2>
            <div className="section-copy"></div>
          </div>

          <div className="form-container">
            <input
              type="text"
              name="url"
              placeholder="URL"
              value={this.props.state.url}
              onChange={this.props.handleChange}
            />

            <div className="dropzone">
              <Dropzone
                onDrop={this.props.onDrop}
                accept="image/png"
                maxFiles={1}
                multiple={false}
              >
                {({
                  getRootProps,
                  getInputProps,
                  isDragActive,
                  isDragReject
                }) => (
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    {this.props.state.expectedImageBase64 ? (
                      ""
                    ) : (
                      <div className="text">
                        {!isDragActive &&
                          "Click here or drop a file to upload!"}
                        {isDragActive &&
                          !isDragReject &&
                          "Drop it like it's hot!"}
                        {isDragReject && "File type not accepted, sorry!"}
                      </div>
                    )}
                  </div>
                )}
              </Dropzone>

              <div className="preview">
                {this.props.state.expectedImageBase64 ? (
                  <img
                    src={this.props.state.expectedImageBase64}
                    alt="image preview"
                  />
                ) : (
                  ""
                )}
              </div>
            </div>

            <button
              className="btn c-white bg-orange b-orange"
              onClick={this.props.handleSubmit}
            >
              Test
            </button>
          </div>
        </div>
      </div>
    );
  }
}
*/
