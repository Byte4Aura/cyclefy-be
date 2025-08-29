import { getDistance } from "geolib";

export const calculateDistance = (start, end) => {
    return (getDistance(start, end) / 1000);
}