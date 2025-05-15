import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Spaces from './pages/Spaces';
import SpaceDetail from './pages/SpaceDetail';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/spaces" component={Spaces} />
        <Route path="/spaces/:id" component={SpaceDetail} />
      </Switch>
    </Router>
  );
}

export default App;
