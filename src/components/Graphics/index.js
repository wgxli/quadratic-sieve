import React, {useState, useEffect} from 'react';

import {InlineMath} from 'react-katex';

import './index.css';


function handleMouseMove(e, setX, width, height) {
    e = e.nativeEvent;

    let pos = null;
    if (e.targetTouches !== undefined) {
        const touches = e.targetTouches;
        pos = [touches[0].pageX, touches[0].pageY];
    } else {
        pos = [e.pageX, e.pageY];
    }

    const idx = [
        Math.floor(pos[0]/window.innerWidth * width),
        Math.floor((1-pos[1]/window.innerHeight) * height)
    ];
    const baseOffset = Math.round(width * height/2);
    setX(idx[1] * width + idx[0] - baseOffset);
}

function Tooltip({x, N}) {
    return <div className='tooltip'>
        <InlineMath>{`x = ${x}`}</InlineMath>
        <InlineMath>{`x^2 - N = ${x.square().minus(N)}`}</InlineMath>
    </div>
}

function Graphics({width, height, base, N, setHighlighted}) {
    const [X, setX] = useState(null);
    const [faded, setFaded] = useState(false);

    useEffect(() => {
        if (X !== null) {
            setHighlighted(X);
            setFaded(false);
            setTimeout(() => {setFaded(true);}, 3000);
        }
    }, [X]);

    return <>
        <div className='loading'>Loading...</div>
        <canvas
            id='canvas'
            width={width} height={height}
            onMouseMove={(e) => handleMouseMove(e, setX, width, height)}
            onTouchMove={(e) => handleMouseMove(e, setX, width, height)}
        />
        {X === null ? null : <Tooltip x={base.plus(X)} N={N} faded={faded}/>}
        <style>{`
            .tooltip {
               opacity: ${faded ? 0 : 1};
               transition: ${faded ? 2 : 0.1}s opacity ease-out;
            }
        `}</style>
    </>;
}

export default Graphics;
