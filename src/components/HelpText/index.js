import React, {useState} from 'react';
import {InlineMath} from 'react-katex';
import {IoIosCalculator as Icon} from 'react-icons/io';
import './index.css';

function HelpText({onClose}) {
    const [open, setOpen] = useState(true);

    function handleClose() {
        setOpen(false);
        onClose();
    }

    return <>
        <div 
           className={'help-container ' + (open ? 'open' : 'closed')}
           onClick={handleClose}
        >
        <div className='help-text' onClick={(e) => e.stopPropagation()}>
            <div className='header'>
                <span className='icon'><Icon/></span>
                <div className='title'>
                    Quadratic Sieve
                    <p className='subtitle'>Made with {'<3'} by Samuel J. Li</p>
                </div>
            </div>
            <div className='help-content'>
            The <b>quadratic sieve</b> is the second-fastest known method for factoring large integers. This is an interactive visualization of the sieving step in this algorithm.

            <ul>
                <li>Each square represents the output of the polynomial <InlineMath>x^2 - n</InlineMath> evaluated at a positive integer. Larger values are brighter.</li>
                <li>During the sieving step, these outputs are divided by small primes, where possible. The pattern of divisibility by each prime is very regular, making this step quite efficient.</li>
                <li>Values that reduce to 1 after the sieving step are <i>smooth</i>, and highlighted in red.</li>
            </ul>
            By collecting enough smooth numbers,
            we can find a subcollection whose product is a square.
            This can be done efficiently with linear algebra.

            <p>This gives us two different integers <InlineMath>x, y</InlineMath> whose squares are equal modulo <InlineMath>n</InlineMath>. With high probability, the identity <InlineMath>x^2 - y^2 = (x+y) \, (x-y)</InlineMath> then yields a factor of <InlineMath>n</InlineMath>.</p>
            </div>

            <button onClick={handleClose}>Got it!</button>
            
        </div></div>
    </>
}

export default HelpText;
