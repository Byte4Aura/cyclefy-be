import { prismaClient } from "../application/database.js";

const getCategories = async () => {
    return await prismaClient.category.findMany({
        where: { is_active: true },
        // select: {
        //     id: true,
        //     name: true,
        //     description: true,
        //     icon: true,
        // }
    });
};

export default { getCategories };