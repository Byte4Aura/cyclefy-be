import fetch from "node-fetch";
import { env } from "../../../src/application/env.js";

export const getRandomUnsplashImageUrl = async () => {
    const queries = ["clothes", "books", "electronics", "furniture", "donation", "charity"];
    const query = queries[Math.floor(Math.random() * queries.length)];

    // Pexels random image api
    const response = await fetch(`https://api.pexels.com/v1/search?query=${query}`, {
        headers: {
            'Authorization': 'EXoKdHXVmyVkHkLtVatSDz5zRh0EhY4zFwWTJY0a5XXWDI7pn2Cy9ija'
        }
    });
    const data = await response.json();
    return data.photos[0].src.medium;

    // Unsplash random image API (600x400)
    // const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}&client_id=${env.unsplashApiKey}`);
    // const data = await response.json();
    // return data.urls.raw;
}

export const getRandomStatus = () => {
    const statuses = ["submitted", "confirmed", "completed", "failed"];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

export const getRandomDonationStatusSequence = () => {
    const sequence = [
        { status: "submitted", status_detail: "donation.submitted_detail" }
    ];

    // Random: lanjut ke confirmed atau tidak
    if (Math.random() < 0.7) { // 70% lanjut ke confirmed
        sequence.push({ status: "confirmed", status_detail: "donation.confirmed_detail" });

        // Random: lanjut ke completed/failed atau tidak
        const isCompleted = Math.random() < 0.5; // 50% completed, 50% failed
        if (Math.random() < 0.6) { // 60% dari yang sudah confirmed lanjut ke status akhir
            sequence.push({
                status: isCompleted ? "completed" : "failed",
                status_detail: `donation.${isCompleted ? "completed" : "failed"}_detail`
            });
        }
    }

    return sequence;
};