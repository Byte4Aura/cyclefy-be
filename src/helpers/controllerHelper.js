import { prismaClient } from "../application/database.js";

export const isRequestParameterNumber = (reqParam) => {
    const num = Number(reqParam);
    return Number.isInteger(num) && Number.isFinite(num)
}