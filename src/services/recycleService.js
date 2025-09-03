import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import { calculateDistance } from "../helpers/geoHelper.js";

const getRecycleLocations = async (userId, search, category, maxDistance, location, sortBy, size, page, reqObject) => {
    // 1. Ambil semua address user login
    const userAddresses = await prismaClient.address.findMany({ where: { user_id: userId } });
    if (!userAddresses.length) throw new ResponseError(404, "user.no_address");

    // 2. Build where clause
    const where = {};
    if (search) {
        where.location_name = { contains: search };
    }
    if (!maxDistance && location) {
        where.address = { contains: location };
    }

    // 3. Query all recycle locations beserta relasi
    const locations = await prismaClient.recycleLocation.findMany({
        where,
        include: {
            recycleLocationCategories: { include: { category: true } },
            RecycleLocationImage: true
        }
    });

    // 4. Filter by category (jika ada)
    let filtered = locations;
    if (category && category.length > 0) {
        const categoryArr = category.map(c => c.trim().toLowerCase());
        filtered = filtered.filter(loc =>
            loc.recycleLocationCategories.some(cat =>
                categoryArr.includes(cat.category.name.toLowerCase())
            )
        );
    }

    // 5. Hitung distance terdekat dari semua address user login
    const mapped = filtered.map(loc => {
        let minDistance = null;
        if (userAddresses.length) {
            const distances = userAddresses.map(addr =>
                calculateDistance(
                    { latitude: addr.latitude, longitude: addr.longitude },
                    { latitude: loc.latitude, longitude: loc.longitude }
                )
            );
            minDistance = Math.min(...distances);
        }
        return {
            id: loc.id,
            location_name: loc.location_name,
            address: loc.address,
            latitude: loc.latitude,
            longitude: loc.longitude,
            distance: minDistance,
            categories: loc.recycleLocationCategories.map(cat => ({
                id: cat.category.id,
                name: cat.category.name
            })),
            images: loc.RecycleLocationImage.map(img => img.image_path)
        };
    });

    // 6. Filter by maxDistance (jika ada)
    let result = mapped;
    if (maxDistance && typeof maxDistance === "number" && !isNaN(maxDistance)) {
        result = result.filter(loc => loc.distance !== null && loc.distance <= maxDistance);
    }

    // 7. Sorting
    if (sortBy === "nearest") {
        result = result.sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999));
    } // default: relevance (urutan dari DB)

    const total = result.length;
    const totalPages = Math.ceil(total / size);
    const paged = result.slice((page - 1) * size, page * size);

    const meta = {
        total: total,
        page: page,
        size: size,
        totalPages: totalPages
    }

    return { meta: meta, data: paged };
};

const getRecycleLocationDetail = async (userId, recycleLocationId, reqObject) => {
    // 1. Ambil semua address user login
    const userAddresses = await prismaClient.address.findMany({ where: { user_id: userId } });
    if (!userAddresses.length) throw new ResponseError(404, "user.no_address");

    // 2. Ambil recycle location beserta relasi
    const loc = await prismaClient.recycleLocation.findUnique({
        where: { id: recycleLocationId },
        include: {
            recycleLocationCategories: { include: { category: true } },
            RecycleLocationImage: true
        }
    });
    if (!loc) throw new ResponseError(404, "recycle_location.not_found");

    // 3. Hitung distance terdekat dari semua address user login
    let minDistance = null;
    if (userAddresses.length) {
        const distances = userAddresses.map(addr =>
            calculateDistance(
                { latitude: addr.latitude, longitude: addr.longitude },
                { latitude: loc.latitude, longitude: loc.longitude }
            )
        );
        minDistance = Math.min(...distances);
    }

    // 4. Mapping response
    return {
        id: loc.id,
        location_name: loc.location_name,
        address: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
        phone: loc.phone,
        description: loc.description,
        distance: minDistance,
        categories: loc.recycleLocationCategories.map(cat => ({
            id: cat.category.id,
            name: cat.category.name
        })),
        images: loc.RecycleLocationImage.map(img => img.image_path)
    };
};

export default {
    getRecycleLocations,
    getRecycleLocationDetail
};