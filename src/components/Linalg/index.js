import React, {useState, useEffect} from 'react';
import {InlineMath, BlockMath} from 'react-katex';

import bigInt from 'big-integer';
import './index.css';



/*
 * This component implements the linear algebra step.
 * It constructs the matrix of exponent vectors for each relation,
 * verifies the relations, and then computes the nullspace
 * via Gaussian elimination over GF(2).
 */


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
function rowReduce(mat) {
    // Copy matrix
    const matrix = [];
    for (let row of mat) {
        matrix.push([...row]);
    }

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

    return matrix;
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
            output.push(pivots[i]);
        }
    }
    return output;
}

// Computes the binary matrix of exponent vectors
// given a list of relations. 
// Also verifies that each relation is actually
// smooth over the factor base.
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

    // Prune out unused factor base primes (from failed relations)
    let prunedFactorBase = [];
    let prunedMat = [];
    for (let i = 0; i < matT.length; i++) {
        if (matT[i].includes(1)) {
            prunedFactorBase.push(factorBase[i]);
            prunedMat.push(matT[i]);
        }
    }
    if (prunedMat.length >= prunedMat[0].length) {
        return {bad};
    }

    return {x, mat: prunedMat, prunedFactorBase};
}

// Assemble relations into a square
// until the resulting factorization is nontrivial.
//
// a is the product of several x values.
//
// b is the product of several y values,
// chosen such that b is the square of some
// integer s.
//
// Since y = x^2 (mod N), it follows that a^2 = s^2 mod N,
// as desired.
function completeFactorization(x, mat, N, factorBase) {
    const reducedMat = rowReduce(mat);
    const nullity = mat[0].length - mat.length;

    for (let i = 0; i < nullity; i++) {
        // Compute null space vector
        const nullVec = nullSpace(reducedMat, i);
        console.log('Nullspace vector ', i, ': ', nullVec);

        // Construct product of appropriate x
        console.log('Constructing a...');
        let a = bigInt(1);
        for (let i of nullVec) {
            a = a.times(x[i]).mod(N);
        }
        a = a.abs();

        // Construct exponent vector for b
        console.log('Constructing b...');
        const expvecB = [];
        for (let i = 0; i < mat.length; i++) {
            let entry = 0;
            let row = mat[i];
            for (let j of nullVec) {
                entry += row[j];
            }
            expvecB.push(entry/2);
        }
        console.log('factorBase', factorBase)
        console.log('bExpVec', expvecB);

        // Construct b
        let b = bigInt(1);
        for (let i = 1; i < expvecB.length; i++) {
            if (expvecB[i] === 0) {continue;}
            const factor = bigInt(factorBase[i]).pow(expvecB[i]);
            b = b.times(factor).mod(N);
        }

        console.log('a', a, 'b', b);
        if (a.neq(b) & a.plus(b).neq(N)) {
            return [a, b, nullVec.length];
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
            const {x, mat, bad, prunedFactorBase} = computeMatrix(relations, factorBase, N, base);
            if (mat === undefined) {
                setError(<>
                    <p>{`Too many (${bad}) relations failed verification. Continue sieving.`}</p>
                    <p>This might also happen if the cell size is too small on desktop.</p>
                </>);
                return;
            }
            const [a, b, l] = completeFactorization(x, mat, N, prunedFactorBase);

            if (a == null) {
                setError(<>
                    <p>Failed to find a nontrivial factor! Are you sure the number is composite?</p>
                    <p>The sieve may also fail if <InlineMath>N</InlineMath> is even or a square.</p>
                </>);
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

            {error ||
                (result === null ? 'Constructing square congruence (may take a while)...' : <>
                    Combining {result.length} of the relations gives the congruence
                    <BlockMath>{`${result.a.toString()}^2`}</BlockMath>
                    <BlockMath>{`\\equiv ${result.b.toString()}^2 \\, (\\mathrm{mod}\\, N),`}</BlockMath>
                    which produces the nontrivial factorization
                    <BlockMath>{`N = ${result.p} \\times ${result.q}.`}</BlockMath>
                </>)
            }

            <button onClick={handleClose}>Close</button>
            
        </div></div>
    </>
}

export default Linalg;
