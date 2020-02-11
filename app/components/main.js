import React, { PropTypes } from "react";
import StylesIgnored from "../styles/main.css";
import Navbar from "./navbar";
import Footer from "./footer";

/*
const Main = props => (
  <div>
    <Navbar />
    {props.children}
    <Footer />
  </div>
);
*/

const Main = props => <div>{props.children}</div>;

Main.propTypes = {
  children: PropTypes.object.isRequired
};

export default Main;
