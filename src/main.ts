import { AttachmentBuilder, Client, IntentsBitField } from "discord.js";
import sharp from "sharp";
import { config } from "dotenv";
import fetchImage from "./fetch-image.js";
import filterAnimated from "./filter-animated.js";
import convertGif from "./convert-gif.js";

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

    if (targetFileURLs.length < 1) {
        return;
    }

    const binaries = await fetchImage(targetFileURLs);

    const sharps = binaries.map(
        (binary) =>
            sharp(binary, { animated: true }).withMetadata()
    );

    const animatedGIFs = await filterAnimated(sharps);

    if (animatedGIFs.length < 1) {
        console.log("Animated WEBP not found. Skip converting...");
        return;
    }

    const convertedBinaries = await convertGif(animatedGIFs);

    const builders = convertedBinaries
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
