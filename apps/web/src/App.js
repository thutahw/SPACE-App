// apps/web/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Spaces from './pages/Spaces';
import SpaceDetail from './pages/SpaceDetail';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Spaces} />
        <Route path="/spaces/:id" component={SpaceDetail} />
      </Switch>
    </Router>
  );
}

export default App;
