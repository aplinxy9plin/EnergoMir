import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route } from "react-router-dom";

import MainPage from './Components/MainPage'
import ResultPage from './Components/ResultPage'
import Update from './Components/Update'

function App() {
  return (
    <Router>
      <Route path="/" exact component={MainPage} />
      <Route path="/result" exact component={ResultPage} /> 
      <Route path="/update" exact component={Update} /> 
  </Router>
  );  
}

export default App;
