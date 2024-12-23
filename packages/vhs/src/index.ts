import { Resource } from "sst";
import Bun, { $ } from "bun";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import LZString from "lz-string";

const s3 = new S3Client();

const server = Bun.serve({
  port: 3001,
  // @ts-ignore
  idleTimeout: 60,
  async fetch(req) {
    const url = new URL(req.url);
    const [, generate, version, payload] = url.pathname.split("/");
    if (generate !== "generate" || !payload)
      return new Response("Not found", { status: 404 });

    const instructions = LZString.decompressFromEncodedURIComponent(payload);
    console.log("instructions", instructions);

    const tape = `
      Output output.gif

      # Set up a 1200x600 terminal with 46px font.
      Set FontSize 16
      Set Width 1200
      Set Height 600
      Set Padding 0
      Set Margin 0

      ${instructions}
    `;
    console.log("tape", tape);

    await Bun.write("input.tape", tape);
    const output = await $`vhs input.tape`.text();
    console.log("output", output);

    const gif = Bun.file("output.gif");

    if (Resource.App.stage === "production") {
      const params = {
        Bucket: Resource.VhsBucket.name,
        Key: `${version}/${payload}`,
        Body: gif,
      };
      const upload = new Upload({ params, client: s3 });
      await upload.done();
    }

    return new Response(gif, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  },
});

console.log(`Bun.serve is running at ${server?.hostname}:${server?.port}`);
