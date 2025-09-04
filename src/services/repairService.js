import { prismaClient } from "../application/database.js"
import { ResponseError } from "../errors/responseError.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { snakeToTitleCase } from "../helpers/statusHelper.js";
import { addressIdOwnershipValidate, isCategoryIdValid, phoneIdOwnershipValidate } from "../helpers/userHelper.js";
import { createRepairValidation } from "../validations/repairValidation.js";
import { validate } from "../validations/validation.js";

const getRepairPrice = async (categoryId) => {
    const repairPrices = await prismaClient.repairPrice.findUnique({
        where: { category_id: categoryId },
        include: {
            category: true,
        }
    });
    if (!repairPrices) throw new ResponseError(404, "repair.price_not_found");
    if (!repairPrices.minor_repair || !repairPrices.moderate_repair || !repairPrices.major_repair) throw new ResponseError(404, "repair.price_not_found");

    return {
        id: repairPrices.id,
        category: {
            id: repairPrices.category.id,
            name: repairPrices.category.name
        },
        minor_price: repairPrices.minor_repair,
        moderate_price: repairPrices.moderate_repair,
        major_price: repairPrices.major_repair,
    }
};

const createRepair = async (userId, requestBody, files, reqObject) => {
    // 1. Validasi request
    const data = validate(createRepairValidation, requestBody, reqObject);

    // 2. Ownership & validasi
    await addressIdOwnershipValidate(userId, data.address_id);
    await phoneIdOwnershipValidate(userId, data.phone_id);
    await isCategoryIdValid(data.category_id);

    // 3. Validasi file upload
    if (!files || (!files.front_view && !files.close_up_damage))
        throw new ResponseError(400, "file.no_file_uploaded");
    if (!Array.isArray(files.front_view) || files.front_view.length === 0)
        throw new ResponseError(400, "file.front_view_required");
    if (!Array.isArray(files.close_up_damage) || files.close_up_damage.length === 0)
        throw new ResponseError(400, "file.close_up_damage_required");

    // 4. Ambil harga per kg dari repairPrice
    const repairPrice = await prismaClient.repairPrice.findUnique({
        where: { category_id: data.category_id }
    });
    if (!repairPrice) throw new ResponseError(404, "repair.price_not_found");

    let pricePerKg = 0;
    if (data.repair_type === "minor_repair") pricePerKg = repairPrice.minor_repair;
    else if (data.repair_type === "moderate_repair") pricePerKg = repairPrice.moderate_repair;
    else if (data.repair_type === "major_repair") pricePerKg = repairPrice.major_repair;
    else throw new ResponseError(400, "repair.invalid_type");

    const amount = pricePerKg * Number(data.item_weight);

    // 5. Simpan entitas Repair
    const repair = await prismaClient.repair.create({
        data: {
            user_id: userId,
            item_name: data.item_name,
            description: data.description,
            category_id: data.category_id,
            item_weight: Number(data.item_weight),
            repair_type: data.repair_type,
            address_id: data.address_id,
            phone_id: data.phone_id,
            repair_location: data.repair_location,
        },
        include: { category: true }
    });

    // 6. Simpan gambar ke RepairImage
    const imagePaths = [];
    const saveImages = async (fileArray, type) => {
        for (const file of fileArray) {
            // Penamaan file sudah diatur di middleware, cukup simpan path dan type
            const image = await prismaClient.repairImage.create({
                data: {
                    repair_id: repair.id,
                    image_path: `/assets/repairs/${file.filename}`,
                    image_name: file.originalname,
                    image_size: file.size,
                    image_type: type
                }
            });
            imagePaths.push(getPictureUrl(reqObject, image.image_path));
        }
    };
    await saveImages(files.front_view, "front_view");
    await saveImages(files.close_up_damage, "close_up_damage");

    // 7. Buat status history
    await prismaClient.repairStatusHistory.create({
        data: {
            repair_id: repair.id,
            status: "request_submitted",
            status_detail: "repair.status.request_submitted_detail",
            // updated_by: userId
        }
    });

    // 8. Buat payment
    const payment = await prismaClient.repairPayment.create({
        data: {
            repair_id: repair.id,
            user_id: userId,
            amount: amount,
            status: "pending"
        },
        include: {
            user: true
        }
    });

    // 9. Mapping response
    return {
        id: repair.id,
        item_name: repair.item_name,
        description: repair.description,
        category: {
            id: repair.category.id,
            name: repair.category.name
        },
        item_weight: repair.item_weight,
        repair_type: repair.repair_type,
        address_id: repair.address_id,
        phone_id: repair.phone_id,
        repair_location: repair.repair_location,
        images: imagePaths,
        status: snakeToTitleCase("request_submitted"),
        payment: {
            id: payment.id,
            repair_id: payment.repair_id,
            user: {
                id: payment.user.id,
                // profile_picture: payment.user.profile_picture,
                profile_picture: (!payment.user.profile_picture.startsWith('http') && !payment.user.profile_picture.startsWith('https'))
                    ? getPictureUrl(reqObject, payment.user.profile_picture)
                    : payment.user.profile_picture,
                username: payment.user.username,
                fullname: payment.user.fullname
            },
            amount: payment.amount,
            status: snakeToTitleCase(payment.status)
        }
    };
};

export default {
    getRepairPrice,
    createRepair
}