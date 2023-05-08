import { AttachmentBuilder, Client, IntentsBitField } from "discord.js";
import fetch from "node-fetch";
import sharp from "sharp";
import { config } from "dotenv";

config();

const client: Client<true> = new Client({
    intents: [
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.Guilds
    ]
});

await client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
    console.log(`Bot logged in as ${client.user.tag} (${client.user.id})`);
});

client.on("messageCreate", async (message) => {
    const targetFileURLs: string[] = [];
    message.attachments.map((attachment) => {
        const type = attachment.contentType;
        const { name } = attachment;

        if (type != "image/webp" && !name.endsWith(".webp")) return;

        console.log(
            `WEBP detected from guild ${message.guild?.name} (${message.guild?.id}) in message ${message.id}`
            + `\n\tname: ${attachment.name}`
            + `\n\turl: ${attachment.url}`
        );
        targetFileURLs.push(attachment.url);
    });

    const fetchPromises = targetFileURLs.map(async (url) => {
        const res = await fetch(url);
        console.log(`WEBP fetched from ${url}`);
        return res.arrayBuffer();
    });

    const fetchResults = await Promise.allSettled(fetchPromises);

    const gifs = fetchResults
        .filter((result) => result.status == "fulfilled")
        .map((result) => {
            // rejected promise already filtered
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const imageBuffer = result.value as ArrayBuffer;
            const image = sharp(imageBuffer, { animated: true });

            return image.withMetadata().gif();
        });

    const gifBufferPromises = gifs.map((gif) => gif.toBuffer());

    const gifBufferResults = await Promise.allSettled(gifBufferPromises);

    const gifBuffers = gifBufferResults
        .filter((result) => result.status == "fulfilled")
        .map((result) =>
            // rejected promise already filtered
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            result.value as Buffer);

    const builders = gifBuffers
        .map((buffer, index) => new AttachmentBuilder(buffer).setName(`image${index}.gif`));

    if (builders.length > 0) {
        try {
            console.log(
                `Send converted images to message ${message.id} in guild ${message.guild?.name} (${message.guild?.id})`
            );
            await message.reply({
                files: builders,
                allowedMentions: {
                    repliedUser: false
                }
            });
        } catch (e) {
            console.error(e);
        }
    }
});
