import fragmentShader from './build/frag.js';
import vertexShader from './build/vert.js';

let gl = null;


// Textures for current and next simulation state
let currentState = null;
let nextState = null;

let framebuffer = null;
let program = null;

// Hyperparameters of simulation
let state = {
    pass: 0, // Render pass
    baseOffset: 0, // Index offset of x_0 from start of grid
    highlight: 0.5, // Index of square to highlight
    highlightMod: 0, // Highlight modulo p
    highlightAlt: 0.5, // Second residue class to highlight (optional)

    logSqrtN: 0,
    delta: 0, // x_0 - sqrt(N)

    prime: 0, // which p to sieve by
    residue: 0, // residue mod p to sieve
};

// Location of GLSL uniforms.
// Will be initialized based on state.
let uniforms = {};


// GLSL Initialization Functions
function createShader(type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {return shader;}

    // Log failure
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram() {
    let vert = createShader(gl.VERTEX_SHADER, vertexShader);
    let frag = createShader(gl.FRAGMENT_SHADER, fragmentShader);

    program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {gl.useProgram(program);}

    // Log failure
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function createScreen() {
    // Initialize vertex position buffers
    let positionAttr = gl.getAttribLocation(program, 'a_position');
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.enableVertexAttribArray(positionAttr);
    gl.vertexAttribPointer(positionAttr, 2, gl.FLOAT, false, 0, 0);

    // Create two triangles covering entire canvas
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
}

function createTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Initialize texture settings
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
}


function createUniforms() {
    // Initialize float uniforms
    for (let [key, value] of Object.entries(state)) {
        uniforms[key] = gl.getUniformLocation(program, 'u_' + key);
        gl.uniform1f(uniforms[key], value);
    }

    // Initialize resolution uniform
    uniforms.resolution = gl.getUniformLocation(program, 'u_resolution');
}



// GLSL Update Functions
function initializeTexture(texture, width, height) {
    gl.bindTexture(gl.TEXTURE_2D, texture);

    console.log('Initializing texture', width, height);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        width, height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.uniform2f(uniforms.resolution, width, height);
}

function setState(name, value) {
    state[name] = value;
    gl.uniform1f(uniforms[name], value);
}




// Main initialization function
function initGL() {
    if (gl !== null) {return;}

    // Get WebGL context
    const canvas = document.getElementById('canvas');
    gl = canvas.getContext('webgl');

    // Initialize program
    createProgram();
    createScreen();

    nextState = createTexture();
    currentState = createTexture();

    framebuffer = gl.createFramebuffer();

    createUniforms();

    handleResize(gl.canvas.width, gl.canvas.height);
}

function handleResize(width, height) {
    initializeTexture(currentState, width, height);
    initializeTexture(nextState, width, height);
    setState('baseOffset', Math.round(width * height / 2));
    gl.viewport(0, 0, width, height);
}

function initSieve(N, base) {
    // Initialize sieve parameters
    const sqrtN = Math.sqrt(N);
    const delta = base.times(base).minus(N) / (base + sqrtN); // Numerically stable computation of base - sqrt(N)
    setState('logSqrtN', Math.log(sqrtN));
    setState('delta', delta);

    // Render to texture
    setState('pass', 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, currentState, 0
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    renderSieve();
}

function updateSieve(residue, prime) {
    console.log('Sieving positions', residue, 'mod', prime);

    // Render to texture
    setState('pass', 1);
    setState('prime', prime);
    setState('residue', residue);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, currentState);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, nextState, 0
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Swap textures
    let temp = currentState;
    currentState = nextState;
    nextState = temp;
}

function renderSieve() {
    // Render to screen
    setState('pass', 2);
    gl.bindTexture(gl.TEXTURE_2D, currentState);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function getRelations() {
    renderSieve();

    const {baseOffset} = state;
    const {width, height} = gl.canvas;
    const data = new Uint8Array(4*width*height);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

    console.log(width*height, baseOffset);

    const relations = [];
    for (let i = 0; i < width*height; i++) {
        if (data[4*i+3] < 255) {
            relations.push(i - baseOffset);
        }
    }
    return relations;
}

export {initGL, initSieve, updateSieve, renderSieve, setState, handleResize, getRelations};
