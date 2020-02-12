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
            <h1 className="section-title c-white">diffy</h1>
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
