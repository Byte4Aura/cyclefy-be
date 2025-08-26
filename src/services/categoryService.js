import { prismaClient } from "../application/database.js";

const getCategories = async (searchFilter) => {
    return await prismaClient.category.findMany({
        where: {
            is_active: true,
            name: {
                contains: searchFilter
            }
        },
        // select: {
        //     id: true,
        //     name: true,
        //     description: true,
        //     icon: true,
        // }
    });
};

export default { getCategories };