// Linear interpolation
function lerp(A, B, t) {
    return A + (B - A) * t;
}

// Return closest intersection from A of line AB through CD
function getIntersection(A, B, C, D) {
    const tNumerator = (D.x-C.x)*(A.y-C.y) - (D.y-C.y)*(A.x-C.x);
    const uNumerator = (C.y-A.y)*(A.x-B.x) - (C.x-A.x)*(A.y-B.y);
    const denominator = (D.y-C.y)*(B.x-A.x) - (D.x-C.x)*(B.y-A.y);

    if (denominator != 0) {
        const t = tNumerator / denominator;
        const u = uNumerator / denominator;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x : lerp(A.x, B.x, t),
                y : lerp(A.y, B.y, t),
                offset : t
            }
        }
    }

    return null;
}

// Return whether any of the lines of poly1 intersect with those of poly2
function polyIntersect(poly1, poly2) {
    for (let i = 0; i < poly1.length; i++) {
        for (let j = 0; j < poly2.length; j++) {
            const touch = getIntersection(
                poly1[i],
                poly1[(i+1) % poly1.length], // Last point connects to first point
                poly2[j],
                poly2[(j+1) % poly2.length]
            );

            if (touch) {
                return true;
            }
        }
    }

    return false;
}