import { ResponseError } from "../errors/responseError.js";
import recycleService from "../services/recycleService.js";

const getRecycleLocations = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const search = req.query.search ?? "";
        const category = req.query.category && req.query.category !== "all"
            ? req.query.category.split(",").map(c => c.trim()).filter(Boolean)
            : [];
        const maxDistance = req.query.maxDistance ? Number(req.query.maxDistance) : null;
        const location = req.query.location ?? "";
        const sortBy = req.query.sortBy ?? "relevance";

        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const size = parseInt(req.query.size) > 0 ? parseInt(req.query.size) : 10;

        const result = await recycleService.getRecycleLocations(
            userId, search, category, maxDistance, location, sortBy, size, page, req
        );
        res.status(200).json({
            success: true,
            message: req.__("recycle_location.get_list_successful"),
            ...result
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getRecycleLocations
};