precision highp float;

uniform sampler2D u_prev;
uniform vec2 u_resolution;
uniform float u_highlight;
uniform float u_highlightMod;
uniform float u_highlightAlt;

uniform float u_logSqrtN; // sqrt(N)
uniform float u_delta; // x_0 - sqrt(N)
uniform float u_baseOffset; // Index offset of x_0 from start of grid

uniform float u_prime;
uniform float u_residue;

uniform float u_pass;
varying vec2 v_texCoord;

const float MAX_VALUE = 100.; // Maximum range of representable floats


float decode(vec4 v) {
    v *= 255.0;
    float decoded = (v.x + (v.y + (v.z + v.w/256.0)/256.0)/256.0)/256.0;
    return MAX_VALUE * decoded - 0.01; // Remap from [0, 1]
}

vec4 encode(float value) {
    value = (value + 0.01) / MAX_VALUE; // Remap to [0, 1]

    vec4 encoded = vec4(0.0, 0.0, 0.0, 0.0);
    for (int i = 0; i < 4; i++) {
        value *= 255.9999;
        float pixel = floor(value);
        value = fract(value);
        encoded[i] = pixel/255.0;
    }
    // To account for rounding bias
    encoded[3] += value/255.0;
    return encoded;
}

void main() {
    // Render Passes
    // 0: Initialize sieve
    // 1: Compute sieved result
    // 2: Convert to brightness for display.
    float value = decode(texture2D(u_prev, v_texCoord));

    // Get number at this location
    vec2 xy_loc = v_texCoord * u_resolution - 0.5;
    float loc = floor(dot(xy_loc, vec2(1., u_resolution.x)) + 0.5) - u_baseOffset;

    if (u_pass < 0.5) {
        // Initialize sieve with value log(abs(x*x-n)).
        float x_red = loc + u_delta; // x - sqrt(N)

        float ratio = 0.5 * x_red * exp(-u_logSqrtN);
        float correction = log(abs(1. + ratio));
        float log_polyOut = log(abs(x_red)) + log(2.) + u_logSqrtN + correction;
        gl_FragColor = encode(log_polyOut);
        return;

        // Equivalent but less numerically stable
//        float polyOut = x * (2. * u_sqrtN + x);
//        gl_FragColor = encode(log(abs(polyOut)));
    }

    if (u_pass < 1.5) {
        // Sieve by provided prime and residue
        float congClass = mod(loc - u_residue + 0.5, u_prime) - 0.5;
        value -= log(u_prime) * clamp(1.-congClass, 0., 1.);
        gl_FragColor = encode(value);
        return;
    }

    // Cell highlighting
    float alpha = 1.;
    vec3 color;

    float residue = loc;
    if (u_highlightMod > 0.) {
        residue = mod(residue+0.5, u_highlightMod) - 0.5;
    }
    float highlight_delta = loc - u_highlight;
    bool highlight = min(abs(residue - u_highlight), abs(residue - u_highlightAlt)) < 1e-3;

    // Display normal view if not highlighted
    if (value < 0.6) {
        color = vec3(1., 0., 0.);
        alpha = 0.98;
    } else {
        color = vec3(value, value, value)/50.;
    }

    // Highlight cells
    if (highlight) {
        if (u_highlightMod == 0.) {
            color = vec3(0.4, 0.6, 0.9);
        } else {
            color = vec3(1., 1., 1.) * (value - log(u_highlightMod))/50.;
        }
    }

    gl_FragColor = vec4(color, alpha);
    return;
}
