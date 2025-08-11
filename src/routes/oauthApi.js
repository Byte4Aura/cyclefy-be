import express from "express";
import passport from "passport";
import { generateJWT } from "../helpers/jwtHelper.js";

const oauthRouter = express.Router();

// Redirect to Google
oauthRouter.get('/api/auth/google', passport.authenticate("google", {
    scope: ["profile", "email"]
}));

// Callback from Google
oauthRouter.get('/api/auth/google/callback',
    passport.authenticate("google", { failureRedirect: '/login' }),
    (req, res) => {
        // Login success using google
        const token = generateJWT(req.user);
        res.status(201).json({
            success: true,
            message: "Authentication with Google successful",
            data: {
                id: req.user.id,
                fullname: req.user.fullname,
                username: req.user.username,
                email: req.user.email,
                profile_picture: req.user.profile_picture
            },
            token: token,
        });
    }
);



export { oauthRouter }