function decodeToken(token) {
    try {
        //Seperate header, payload, signature
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        //Decode payload
        const payload = parts[1];
        const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        
        //Convert JSON string to object
        const jsonPayload = JSON.parse(decodedPayload);
        
        return jsonPayload;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

export function getUserIdFromToken(token) {
    const decoded = decodeToken(token);
    if (decoded && decoded.sub) {
        return decoded.sub;
    }
    return null;
}