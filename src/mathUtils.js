import bigInt from 'big-integer';

function legendre(a, p) {
    return a.modPow((p-1)/2, p);
}

// Computes square root modulo p.
function modSqrt(a, p) {
    console.log('modSqrt', a, p);
    if (p === 2) {return a;}
    if (a.eq(0)) {return 0;}

    // First check Legendre symbol
    if (legendre(a, p).eq(p-1)) {
        console.log('Not a QR');
        return undefined;
    }

    // Tonelli-Shanks algorithm
    let q = p-1;
    let s = 0;
    while (q % 2 === 0) {
        q /= 2;
        s += 1
    }

    if (s === 1) {
        return a.modPow((p+1)/4, p);
    }
    let z = bigInt(2);
    for (; z.lt(p); z = z.add(1)) {
        if (legendre(z, p).eq(p-1)) {break;}
    }

    let c = z.modPow(q, p);
    let r = a.modPow((q+1)/2, p);
    let t = a.modPow(q, p);

    let m = s;
    let t2 = 0;
    while ((t-1) % p !== 0) {
        console.log(t);
        t2 = (t*t) % p;

        let i = 1;
        for (i = 1; i < m; i++) {
            if ((t2-1) % p === 0) {break;}
            t2 = (t2 * t2) % p
        }

        let b = c.modPow(1 << (m-i-1), p);
        r = r.times(b).mod(p);
        c = b.times(b).mod(p);
        t = (t * c) % p;
        m = i;
    }
    return r;
}

function isqrt(n) {
    if (n.leq(2)) { return n; }

    let L = bigInt(0);
    let R = n.plus(1);

    while (R.minus(L).neq(1)) {
        let M = L.plus(R).divide(2);
        if (M.times(M).leq(n)) {
            L = M;
        } else {
            R = M;
        }
    }
    return L;
}


// Generate primes up to MAX
const MAX = 1000000;
const sieve = new Array(MAX).fill(true);

sieve[0] = false;
sieve[1] = false;
for (let i=2; i < Math.sqrt(MAX); i++) {
    if (sieve[i]) {
        for (let j = i*i; j < MAX; j+= i) {
                sieve[j] = false;
        }
    }
}

const primeList = [];
for (let i=2; i < MAX; i++) {
	if (sieve[i]) {primeList.push(i);}
}

export {primeList, isqrt, modSqrt};
