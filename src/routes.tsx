import * as React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import { FullPageSketch } from "./routes/fullPageSketch";
import { HomePage } from "./routes/homePage";
import { ISketch } from "./sketch";
import sketches = require("./sketches");
import wipSketches = require("./wip");

const sketchRoutes = sketches.map((sketchClass) => {
    const path = `/${sketchClass.id}`;
    return <Route key={path} path={path} component={() => <FullPageSketch sketchClass={sketchClass} />} />;
});

const wipSketchRoutes = wipSketches.map((sketchClass) => {
    const path = `/wip/${sketchClass.id}`;
    return <Route key={path} path={path} component={() => <FullPageSketch sketchClass={sketchClass} />} />;
});

const WipListing = () => (
    <>
        <h1><a href="/">Home</a></h1>
        <ul>
            {
                wipSketches.map((sketch) => (
                    <li>
                        <a href={`/wip/${sketch.id}`}>{sketch.id}</a>
                    </li>
                ))
            }
        </ul>
    </>
);

const SlidesIntroCC = () => {
    return (
        <iframe
            className="slides"
            src="https://docs.google.com/presentation/d/e/2PACX-1vT1rzydBsfDy4wx_Y4xcGdMzz_y1WzYMfvuHJB1xbdHtxxozoH3XFLikmc8a3wbEUIKTWBmRh3-8pAq/embed?start=false&loop=false"
            frameBorder="0" allowFullScreen>
        </iframe>
    );
}

const SlidesDiveCC = () => {
    return (
        <iframe
            className="slides"
            src="https://docs.google.com/presentation/d/e/2PACX-1vS8RZPhfhg8DgBzsSlnCWc8MbGKkedX9qv_JKtuNQItsjSaF7MhFvlHdeP7OpO0cSaaZnv1NhLz53dE/embed?start=false&loop=false"
            frameBorder="0" allowFullScreen>
        </iframe>
    );
}

export const Routes = () => (
    <Switch>
        { sketchRoutes }
        { wipSketchRoutes }
        <Route path="/slides/introcc" component={SlidesIntroCC} />
        <Route path="/slides/divecc" component={SlidesDiveCC} />
        <Route path="/wip" component={WipListing} />
        <Route path="/" component={HomePage} />
    </Switch>
);
