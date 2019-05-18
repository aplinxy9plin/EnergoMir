import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route } from "react-router-dom";

import MainPage from './Components/MainPage'
import ResultPage from './Components/ResultPage'

function App() {
  return (
    <Router>
      <Route path="/" exact component={MainPage} />
      <Route path="/result" exact component={ResultPage} /> 
  </Router>
  );  
}

export default App;
