import React, { Component } from "react";

export default class Results extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="results">
        <div className="container">
          <h2>Results</h2>

          <div className="stats">
            <div className="stat-item">
              <span className="title">Error: </span>
              <span className="data">
                {Math.round((this.props.state.error * 100) / 100)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="title">Accuracy: </span>
              <span className="data">
                {Math.round((this.props.state.accuracy * 100) / 100)}%
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

          <table>
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
              className="btn c-white bg-orange b-orange"
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
