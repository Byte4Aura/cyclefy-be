import path from "path";

export const getProfilePictureUrl = (req, path) => {
    if (!path) return null;
    return `${req.protocol}://${req.get('host')}${path.replace('/src', '')}`;
}

export const publicPathToDiskPath = (publicPath) => {
    // Only path that start with /assets/profiles
    if (!publicPath.startsWith("/assets/profiles/")) return null;

    // remove leading slash, then add src/
    return path.resolve("src" + publicPath);
};

export const getPictureUrl = (req, path) => {
    if (!path) return null;
    return `${req.protocol}://${req.get('host')}${path.replace('/src', '')}`;
}