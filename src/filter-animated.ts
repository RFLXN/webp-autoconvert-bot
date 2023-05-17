import { Sharp } from "sharp";

const filterAnimated = async (sharps: Sharp[]) => {
    const filters = sharps.map(async (sharp) => {
        const meta = await sharp.metadata();

        if (typeof meta.pages != "undefined" && meta.pages > 1) {
            return sharp;
        }
    });

    const filtered = await Promise.allSettled(filters);

    const animatedGifs: Sharp[] = [];
    for (const filter of filtered) {
        if (filter.status == "rejected") {
            console.error(filter.reason);
        } else if (filter.status == "fulfilled" && typeof filter.value != "undefined") {
            animatedGifs.push(filter.value);
        }
    }

    return animatedGifs;
};

export default filterAnimated;
