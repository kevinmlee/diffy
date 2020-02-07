import React, { Component } from "react";
//import Dropzone from "react-dropzone";

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

            <input
              label="Image"
              type="file"
              name="image"
              accept=".png"
              onChange={this.props.onDrop}
            />

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
