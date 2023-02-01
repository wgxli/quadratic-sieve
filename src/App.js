import React, {useState, useEffect} from 'react';
import bigInt from 'big-integer';

import Graphics from './components/Graphics';
import Controls from './components/Controls';
import Infobar from './components/Infobar';
import HelpText from './components/HelpText';
import Linalg from './components/Linalg';

import 'katex/dist/katex.min.css';

import {modSqrt, primeList, isqrt} from './mathUtils';
import {
    initGL, initSieve,
    updateSieve, renderSieve,
    setState as setGLUniform,
    handleResize,
    getRelations
} from './gl';

import './App.css';


// Get residue classes to sieve
function getSieve(N, p, base) {
    const qr = modSqrt(N.mod(p), p);
    const res = base.mod(p);

    if (qr !== undefined) {
        const t1 = ((qr - res) % p + p) % p;
        const t2 = ((-qr - res) % p + p) % p;
        return [t1, t2];
    }

    return [null, null];
}

// Utilities for cell highlighting
function highlightOff() {
    setGLUniform('highlight', 0.5);
    setGLUniform('highlightAlt', 0.5);
    setGLUniform('highlightMod', 0);
    renderSieve();
}


function setHighlighted(x) {
    setGLUniform('highlight', x);
    setGLUniform('highlightAlt', x);
    setGLUniform('highlightMod', 0);
    renderSieve();
}


let width = 1;
let height = 1;

let factorBase = [-1];

// Main app
function App() {
    const [N, rawSetN] = useState(bigInt(0)); // Number to factor
    const [base, setBase] = useState(bigInt(0)); // Number to factor
    const [pIdx, setP] = useState(0); // Index of current prime to sieve
    
    const [cellSize, setCellSize] = useState(30);
    const [relations, setRelations] = useState([]);

    const [openLinalg, setOpenLinalg] = useState(false);

    function setN(N) {
        const base = isqrt(N);

        setP(0);
        setBase(base);
        rawSetN(N);

        setGLUniform('highlightMod', 0);
        setTimeout(() => initSieve(N, base), 0);
    }

    function sieve(suppressRender) {
        const p = primeList[pIdx];
        if (factorBase.includes(p)) {return;}
        const [t1, t2] = getSieve(N, p, base);

        const readoutInterval = (cellSize < 5) ? 100 : 10;

        const shouldRender = !suppressRender | (pIdx % readoutInterval === 0);

        if (t1 !== null) {
            updateSieve(t1, p);
            if (t1 !== t2) {
                updateSieve(t2, p);
            }
            factorBase.push(p);
        }

        if (shouldRender) {
            setRelations(getRelations());
            if (window.innerWidth > 600) {
                highlightResidues(primeList[pIdx+1]);
            }
        }
        setP(pIdx+1);
    }


    useEffect(() => initGL(), []);
    useEffect(() => {
        width = Math.ceil(4*window.innerWidth/cellSize);
        height = Math.ceil(4*window.innerHeight/cellSize);
        handleResize(width, height);
        setN(N);
    }, [cellSize, N]);
    useEffect(() => setN(bigInt(853972440679)), []);
    useEffect(() => {
        setRelations([]);
        factorBase = [-1];
    }, [base]);


    // Prevent zoom on mobile
    const preventDefault = (e) => e.preventDefault();
    function registerListener() {
        document.addEventListener('gesturestart', preventDefault, {passive: false});
        document.addEventListener('touchmove', preventDefault, {passive: false});
    }


    function highlightResidues(p) {
        const [t1, t2] = getSieve(N, p, base);
        if (t1 === null) {
            highlightOff();
            return;
       }
        setGLUniform('highlight', t1);
        setGLUniform('highlightAlt', t2);
        setGLUniform('highlightMod', p);
        renderSieve();
    }

    return <>
        <Graphics
            width={width}
            height={height}
            base={base}
            N={N}
            setHighlighted={setHighlighted}
        />
        <Controls
            state={{N, p: primeList[pIdx], cellSize}}
            setN={setN}
            sieve={sieve}
            setHighlight={(v) => v ? highlightResidues(primeList[pIdx]) : highlightOff()}
            setCellSize={setCellSize}
            linalgOpen={openLinalg}
        />
        <Infobar
            relations={relations}
            factorBase={factorBase}
            base={base}
            shift={Math.round(width*height/2)} 
            onFinish={() => setOpenLinalg(true)}
        />
        <HelpText onClose={registerListener}/>
        <Linalg
            open={openLinalg}
            handleClose={() => setOpenLinalg(false)}
            relations={relations}
            factorBase={factorBase}
            N={N}
            base={base}
        />
    </>;
}

export default App;
