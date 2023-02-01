import React, {useState, useEffect} from 'react';

import bigInt from 'big-integer';

import {InlineMath} from 'react-katex';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';

import './index.css';

function handleTextChange(v, setN, setTextState) {
    const value = parseInt(v);
    if (value > 0 & !isNaN(v) & !isNaN(value)) {
        if (v.length > 30) {
            setTextState({Nstr: v, error: false, helper: 'Might take too long to factor'});
        } else {
            setTextState({Nstr: v, error: false, helper: ' '});
        }
        setN(bigInt(v));
    } else {
        setTextState({Nstr: v, error: true, helper: 'Must be a positive integer'});
    }
}

let autosieve = false;

function Controls({state, setN, sieve, setHighlight, setCellSize, linalgOpen}) {
    const [textState, setTextState] = useState({
        Nstr: '853972440679',
        error: false,
        helper: ' ',
    });
    const [cellTextState, setCellTextState] = useState({
        value: '30',
        error: false
    });

    function doAutosieve() {
        if (linalgOpen) {autosieve = false;}
        if (!autosieve) {return;}
        setTimeout(() => sieve(true), 1);
        console.log('autosieve', autosieve);
    }

    useEffect(doAutosieve, [state]);

    function handleCellChange(s) {
        const value = parseInt(s);
        if (value > 0 & value <= 300) {
            setCellSize(s);
            setCellTextState({value: s, error: false});
        } else {
            setCellTextState({value: s, error: true});
        }
    }


    return <div id='controls'>
        <div className='input-wrapper'>
            <div className='N'>
            <InlineMath>N =</InlineMath>
            </div>
            <TextField
                id='number-input'
                placeholder='Enter an integer to factor'
                error={textState.error}
                value={textState.Nstr}
                onChange={e => handleTextChange(e.target.value, setN, setTextState)}
                autoFocus
                fullWidth
                style={{marginLeft:10}}
                disabled={autosieve}
                helperText={textState.helper}
            />
            <div className='cell-size'>
            <TextField
                type='number' 
                helperText='Cell Size'
                value={cellTextState.value}
                onChange={(e) => handleCellChange(e.target.value, setCellTextState)}
                error={cellTextState.error}
                disabled={autosieve}
            />
            </div>
        </div>
        <div className='sieve-wrapper'>
            <Button
                style={{textTransform: 'none', whiteSpace: 'nowrap'}}
                onClick={() => sieve(false)}
                variant='contained'
                color='primary'
                onMouseOver={() => setHighlight(window.innerWidth > 600)}
                onMouseLeave={() => setHighlight(false)}
                disabled={autosieve}
            >
                <span style={{marginRight: 5}}>Sieve</span>
                <InlineMath>{`p = ${state.p}`}</InlineMath>
            </Button>
            <div className='checkbox-wrapper'>
            <Checkbox
                id='autosieve' color='primary'
                checked={autosieve}
                onChange={(e) => {autosieve = e.target.checked; sieve(); doAutosieve(sieve);}}
            />
                <label htmlFor='autosieve' style={{marginLeft: -5, marginRight: 10}}>Auto sieve</label>
            </div>
        </div>
    </div>
}

export default Controls;
