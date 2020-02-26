import React, { Component } from "react";

let moment = require("moment");

export default class Results extends Component {
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
      <div id="results" className="bubbles-bg">
        {bubbles}

        <div className="container">
          <h2 className="ta-center c-white">Results</h2>

          <div className="stats ta-center c-white">
            <div className="stat-item">
              <span className="title">Accuracy: </span>
              <span className="data">
                {Math.round((this.props.state.accuracy * 100) / 100)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="title">Error: </span>
              <span className="data">
                {Math.round((this.props.state.error * 100) / 100)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="title">Page load time: </span>
              <span className="data">
                {(this.props.state.performanceMetrics.timing.loadEventEnd -
                  this.props.state.performanceMetrics.timing.navigationStart) /
                  1000}{" "}
                seconds
              </span>
            </div>
            {this.props.state.timeToComplete > 0 ? (
              <div className="stat-item">
                <span className="title">Runtime: </span>
                <span className="data">
                  {Math.round((this.props.state.timeToComplete * 100) / 100)}{" "}
                  seconds
                </span>
              </div>
            ) : (
              ""
            )}
          </div>

          <div className="processed-links">
            <div class="empty">
              Empty Links: {this.props.state.processedLinks.empty}
            </div>
            <div class="failed">
              Failed Links:{" "}
              {this.props.state.processedLinks.failed.length > 0
                ? this.props.state.processedLinks.failed.map((item, i) => {
                    return (
                      <div class="failed-item" key={i} answer={item.url}>
                        {item.status} : {item.url}
                      </div>
                    );
                  })
                : "0"}
            </div>
            <div class="passed">
              Passed Links:{" "}
              {this.props.state.processedLinks.passed.length > 0
                ? this.props.state.processedLinks.passed.map((item, i) => {
                    return (
                      <div class="passed-item" key={i} answer={item.url}>
                        {item.status} : {item.url}
                      </div>
                    );
                  })
                : "0"}
            </div>
          </div>

          <table className="c-white">
            <thead>
              <tr>
                <th>Expected</th>
                <th>Actual</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <img
                    src={this.props.state.expectedImageBase64}
                    alt="expected result"
                  />
                </td>
                <td>
                  <img
                    src={
                      "data:image/png;base64," +
                      this.props.state.actualImageBase64
                    }
                    alt="actual result"
                  />
                </td>
                <td>
                  <img
                    src={
                      "data:image/png;base64," +
                      this.props.state.diffImageBase64
                    }
                    alt="difference"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="btn-container ta-center">
            <button
              className="btn c-black bg-white-opaque h-bg-white"
              onClick={this.props.reset}
            >
              Test something else
            </button>
          </div>
        </div>
      </div>
    );
  }
}
