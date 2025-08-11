import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import { prismaClient } from "./database.js";
import { v4 as uuidv4 } from "uuid";
import { ResponseError } from "../errors/responseError.js";
import { generateUniqueUsername } from "../helpers/authHelper.js";

passport.use(new GoogleStrategy({
    clientID: env.google.clientId,
    clientSecret: env.google.clientSecret,
    callbackURL: env.google.callbackURL
}, async (accessToken, refreshToken, profile, doneCallback) => {
    try {
        const email = profile.emails[0].value;
        let user = await prismaClient.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            // CASE: User didn't exists, create new user
            // Generate random password
            const randomPassword = uuidv4();

            // Create user
            let username = await generateUniqueUsername(profile.displayName);
            user = await prismaClient.user.create({
                data: {
                    fullname: profile.displayName,
                    username: username,
                    email: email,
                    password: randomPassword,
                    is_email_verified: true,
                    email_verified_at: new Date(),
                    is_active: true,
                    profile_picture: profile.photos?.[0]?.value || null,
                }
            });

            // Upsert provider data (For new & old user)
            await prismaClient.userOauthProvider.upsert({
                where: {
                    user_id_provider: {
                        user_id: user.id,
                        provider: "google"
                    }
                },
                update: {
                    provider_id: profile.id,
                    provider_email: email,
                    provider_data: profile._json
                },
                create: {
                    user_id: user.id,
                    provider: "google",
                    provider_id: profile.id,
                    provider_email: email,
                    provider_data: profile._json
                }
            });
            return doneCallback(null, user);
        } else {
            // CASE: User already exists
            if (!user.is_email_verified) {
                await prismaClient.user.update({
                    where: { id: user.id },
                    data: {
                        is_email_verified: true,
                        email_verified_at: new Date(),
                        profile_picture: profile.photos?.[0]?.value || user.profile_picture,
                        password: user.password
                    }
                });

                // Upsert data provider
                await prismaClient.userOauthProvider.upsert({
                    where: {
                        user_id_provider: {
                            user_id: user.id,
                            provider: 'google'
                        }
                    },
                    update: {
                        provider_id: profile.id,
                        provider_email: email,
                        provider_data: profile._json
                    },
                    create: {
                        user_id: user.id,
                        provider: "google",
                        provider_id: profile.id,
                        provider_email: email,
                        provider_data: profile._json
                    }
                });
            }

            return doneCallback(null, user);
        }
    } catch (error) {
        return doneCallback(error, null);
        // throw new ResponseError(error.status, error.message);
    }
}));

passport.serializeUser((user, doneCallbck) => {
    doneCallbck(null, user.id);
});

passport.deserializeUser(async (id, doneCallback) => {
    const user = await prismaClient.user.findUnique({
        where: { id: id }
    });
    doneCallback(null, user);
});

export default passport;