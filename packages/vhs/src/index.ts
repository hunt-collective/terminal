import Bun, { $ } from "bun";
import { Resource } from "sst";
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
    const tape = `
      Output output.gif

      Set Framerate 24 
      Set Width 750
      Set Height 600
      Set Padding 0
      Set Margin 0

      Set FontSize 20
      Set FontFamily "Geist Mono"
      # Set Theme { "name": "Whimsy", "black": "#535178", "red": "#ef6487", "green": "#5eca89", "yellow": "#fdd877", "blue": "#65aef7", "magenta": "#aa7ff0", "cyan": "#43c1be", "white": "#ffffff", "brightBlack": "#535178", "brightRed": "#ef6487", "brightGreen": "#5eca89", "brightYellow": "#fdd877", "brightBlue": "#65aef7", "brightMagenta": "#aa7ff0", "brightCyan": "#43c1be", "brightWhite": "#ffffff", "background": "#29283b", "foreground": "#b3b0d6", "selection": "#3d3c58", "cursor": "#b3b0d6" }

      Hide
      Type "terminal"
      Enter
      Sleep 3s
      Show

      Sleep 1s
      ${instructions}
    `;
    console.log("tape", tape);

    await Bun.write("input.tape", tape);
    const output = await $`vhs input.tape`.text();
    console.log("output", output);

    const gif = Bun.file("output.gif");

    if (Resource.App.stage === "production" || Resource.App.stage === "dev") {
      const params = {
        Bucket: Resource.VhsBucket.name,
        Key: `generate/${version}/${payload}`,
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
