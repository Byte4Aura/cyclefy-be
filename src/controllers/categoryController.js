import categoryService from "../services/categoryService.js";

const getCategories = async (req, res, next) => {
    try {
        const result = await categoryService.getCategories();
        res.status(200).json({
            success: true,
            message: req.__('category.get_list_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export default { getCategories };