import NodeGeocoder from "node-geocoder";
import { ResponseError } from "../errors/responseError.js";

const geocoder = NodeGeocoder({
    provider: "openstreetmap",
    headers: {
        "User-Agent": "cyclefy-backend/1.0 (cyclefyteam@gmail.com)"
    }
});

export const geocodeAddress = async (address) => {
    const result = await geocoder.geocode(address);
    if (result && result.length > 0) {
        return result[0];
    }
    throw new ResponseError(404, 'address.geocode_not_found', {
        result: result
    });
}