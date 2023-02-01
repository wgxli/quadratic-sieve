import React, {useState, useEffect} from 'react';
import {BlockMath} from 'react-katex';

import bigInt from 'big-integer';
import {isqrt} from '../../mathUtils';

import './index.css';


// Finds index of smallest nonnegative entry.
function argmin(arr, max) {
    let min = max;
    let out = null;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] >= 0 & arr[i] < min) {
            min = arr[i];
            out = i;
        }
    }
    return out;
}

// In-place xor array a by array b.
function ixor(a, b) {
    for (let i = 0; i < a.length; i++) {
        a[i] ^= b[i];
    }
}

// Computes row-reduced echelon form (RREF) of a matrix over GF(2).
function rowReduce(matrix) {
    const cols = matrix[0].length;

    // Gaussian elimination
    const rows = matrix.length;
    for (let i = 0; i < rows; i++) {
        const pivots = matrix.slice(i).map(row => row.indexOf(1));
        let target = argmin(pivots, cols);
        if (target === null) {break;}
        const j = pivots[target];
        target += i;

        console.log(target, j);

        // Eliminate other rows
        for (let k = 0; k < rows; k++) {
            if (k !== target & matrix[k][j]) {
                ixor(matrix[k], matrix[target]);
            }
        }

        // Swap to ith position
        let temp = matrix[i];
        matrix[i] = matrix[target];
        matrix[target] = temp;
    }
}

// Computes kth vector in basis of null-space of a matrix (assumed to be in RREF).
function nullSpace(mat, k) {
    const pivots = mat.map(row => row.indexOf(1)).filter(i => i >= 0);
    const pivotSet = new Set(pivots);

    // Find first non-pivot column (guaranteed to exist)
    let j = 0;
    let count = 0;
    for (; j < mat[0].length; j++) {
        if (!pivotSet.has(j)) {count++;}
        if (count > k) {break;}
    }
    const output = [j];

    // Find all pivot columns including i
    for (let i = 0; i < mat.length; i++) {
        if (mat[i][j] === 1) {
            console.log(i);
            output.push(pivots[i]);
        }
    }
    return output;
}

function computeMatrix(relations, factorBase, N, base) {
    const x = []; // Polynomial inputs
    const y = []; // Polynomial outputs
    const mat = []; // Matrix of exponent vectors

    const maxRelations = factorBase.length + 64; // Discard unnecessary relations

    let bad = 0;
    for (let r of relations) {
        const xx = base.plus(r);
        const yy = xx.times(xx).minus(N);

        // Construct exponent vector
        const row = [yy.lt(0) ? 1 : 0];
        for (let p of factorBase.slice(1)) {
            row.push(yy.mod(p).eq(0) ? 1 : 0);
        }

        // Verify relation
        let curr = yy;
        for (let j = 0; j < row.length; j++) {
            if (row[j]) {
                curr = curr.divide(factorBase[j]);
            }
        }
        if (curr.eq(1)) {
            x.push(xx);
            y.push(yy);
            mat.push(row);
        } else {
            bad++;
        }

        if (x.length >= maxRelations) {break;}
    }

    // Take the transpose
    let matT = [];
    for (let j = 0; j < mat[0].length; j++) {
        const row = [];
        for (let i = 0; i < mat.length; i++) {
            row.push(mat[i][j]);
        }
        matT.push(row);
    }

    // Prune out unused factor base primes
    matT = matT.filter(row => row.includes(1));
    if (matT.length >= matT[0].length) {
        return {bad};
    }

    return {x, y, mat: matT};
}

function completeFactorization(x, y, mat, N) {
    rowReduce(mat);
    const nullity = mat[0].length - mat.length;

    for (let i = 0; i < nullity; i++) {
        // Compute null space vector
        const nullVec = nullSpace(mat, i);

        // Get corresponding congruence of squares
        console.log('Constructing congruence for nullspace vector ', i);
        let a = bigInt(1);
        let b = bigInt(1);
        for (let i of nullVec) {
            a = a.times(x[i]).mod(N);
            b = b.times(y[i]);
        }
        a = a.abs();
        const s = isqrt(b);
//        console.log(s.times(s), b); // Should be equal
        const c = s.mod(N);
        if (a.neq(c) & a.plus(c).neq(N)) {
            return [a, c, nullVec.length];
        }
    }
    return [null, null];
}


function Linalg({open, handleClose, relations, factorBase, N, base}) {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!open) {setResult(null); setError(false); return;}
        setTimeout(() => {
            const {x, y, mat, bad} = computeMatrix(relations, factorBase, N, base);
            if (mat === undefined) {
                setError(<>
                    <p>{`Too many (${bad}) relations failed verification. Continue sieving.`}</p>
                    <p>This might also happen if the cell size is too small on desktop.</p>
                </>);
                return;
            }
            const [a, b, l] = completeFactorization(x, y, mat, N);

            if (a == null) {
                setError('Failed to find a nontrivial factor! Are you sure the number is composite?');
            } else {
                let p = bigInt.gcd(a.plus(b), N);
                let q = N.divide(p);
                setResult({length: l, a, b, p, q});
            }
        }, 50);
    }, [open, relations, factorBase, N, base]);

    return <>
        <div 
           className={'linalg-container ' + (open? 'open' : 'closed')}
            onClick={handleClose}
        >
        <div className='linalg-text' onClick={(e) => e.stopPropagation()}>

            {error ? <p>{error}</p> :
                (result === null ? 'Constructing square congruence (may take a while)...' : <>
                    Combining {result.length} of the relations gives the congruence
                    <BlockMath>{`${result.a.toString()}^2`}</BlockMath>
                    <BlockMath>{`\\cong ${result.b.toString()}^2 \\, (\\mathrm{mod}\\, N),`}</BlockMath>
                    which produces the nontrivial factorization
                    <BlockMath>{`N = ${result.p} \\times ${result.q}.`}</BlockMath>
                </>)
            }

            <button onClick={handleClose}>Close</button>
            
        </div></div>
    </>
}

export default Linalg;
