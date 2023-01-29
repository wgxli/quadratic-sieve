import React, {useState, useEffect} from 'react';

import Graphics from './components/Graphics';
import Controls from './components/Controls';
import Infobar from './components/Infobar';
import HelpText from './components/HelpText';

import 'katex/dist/katex.min.css';

import {initSieve, setState as setGLState} from './gl';

import './App.css';

function App() {
    const [state, setAppState] = useState({
        N: 314159 * 2718281,
    });
    const setState = (s) => {
        console.log(s);
        for (let [k, v] of Object.entries(state)) {
            setGLState(k, v);
        }
        setAppState(s);
    }
    useEffect(() => initSieve(setAppState), []);

    // Resize handler
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const onResize = () => {
        const dpr = window.devicePixelRatio;
        setWidth(window.innerWidth * dpr);
        setHeight(window.innerHeight * dpr);
    }
    useEffect(() => {
        window.addEventListener('resize', onResize);
        onResize();
    });



    // Prevent zoom on mobile
    const preventDefault = (e) => e.preventDefault();
    useEffect(() => {
        document.addEventListener('gesturestart', preventDefault, {passive: false});
        document.addEventListener('touchmove', preventDefault, {passive: false});
    });

    return <>
        <Graphics width={width} height={height}/>
        <Controls state={state} setState={setState}/>
        <Infobar
            state={state}
        />
        <HelpText/>
    </>;
}

export default App;
