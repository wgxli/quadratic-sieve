import React  from 'react';
import Button from '@material-ui/core/Button';
import './index.css';


function Entry({name, value}) {
    return <div className='entry'>
        <p className='name'>{name}</p>
        <div className='value'>
            {value}
        </div>
    </div>
}

const safetyMargin = 5;

function Infobar({relations, factorBase, base, shift, onFinish}) {
    const done = relations.length > factorBase.length + safetyMargin;

    return <div className='info-bar'>
        <Entry name='Relations Needed' value={factorBase.length + 1 + safetyMargin}/>
        <Entry name='Relations Found' value={relations.length}/>
        <div className='finish'>
            <Button disabled={!done} onClick={onFinish} variant='outlined'>Complete Factorization</Button>
            {done ? null : <p className='warning'>Not enough relations! Sieve for longer, or decrease the cell size.</p>}
        </div>
        <div className='entry footer'>
            <p className='caption'>
                {'Made with <3 by Samuel J. Li'}</p>
        </div>
    </div>;
}

export default Infobar;
