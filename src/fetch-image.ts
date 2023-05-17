import fetch from "node-fetch";

const fetchImages = async (urls: string[]) => {
    const buffers = urls.map(async (url) => {
        const res = await fetch(url);
        console.log(`WEBP fetched from ${url}`);
        return res.arrayBuffer();
    });

    const results = await Promise.allSettled(buffers);

    const binaries: ArrayBuffer[] = [];

    for (const result of results) {
        if (result.status == "rejected") {
            console.error(result.reason);
        } else {
            const buffer = result.value;
            binaries.push(buffer);
        }
    }

    return binaries;
};

export default fetchImages;
