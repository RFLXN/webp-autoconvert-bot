import { Sharp } from "sharp";

const convertGif = async (sharps: Sharp[]) => {
    const gifs = sharps.map((sharp) => sharp.gif().toBuffer());

    const buffers = await Promise.allSettled(gifs);

    const binaries: Buffer[] = [];

    for (const buffer of buffers) {
        if (buffer.status == "rejected") {
            console.error(buffer.reason);
        } else if (buffer.status == "fulfilled" && buffer.value) {
            binaries.push(buffer.value);
        }
    }

    return binaries;
};

export default convertGif;
