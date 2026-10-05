const path = require("path");
const { spawnSync } = require("child_process");

const ffmpeg = require("ffmpeg-static");
const root = path.resolve(__dirname, "..");
const socialDir = path.join(root, "public", "assets", "social");

const inputs = [1, 2, 3].map((number) =>
  path.join(socialDir, `gaia-elixir-real-manos-${number}.png`)
);
const output = path.join(socialDir, "gaia-elixir-reel-manos-real.mp4");

const args = [
  "-y",
  ...inputs.flatMap((input) => ["-loop", "1", "-t", "3.7", "-i", input]),
  "-filter_complex",
  [
    "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920," +
      "zoompan=z='min(1.02+0.00012*on,1.034)':x='iw/2-(iw/zoom/2)+2*sin(on/13)':y='ih/2-(ih/zoom/2)+2*cos(on/17)':d=111:s=1080x1920:fps=30,setsar=1[v0]",
    "[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920," +
      "zoompan=z='max(1.034-0.0001*on,1.023)':x='iw/2-(iw/zoom/2)+2*cos(on/15)':y='ih/2-(ih/zoom/2)+2*sin(on/19)':d=111:s=1080x1920:fps=30,setsar=1[v1]",
    "[2:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920," +
      "zoompan=z='min(1.018+0.0001*on,1.03)':x='iw/2-(iw/zoom/2)+2*sin(on/16)':y='ih/2-(ih/zoom/2)+2*cos(on/21)':d=111:s=1080x1920:fps=30,setsar=1[v2]",
    "[v0][v1]xfade=transition=fade:duration=0.45:offset=3.25[x1]",
    "[x1][v2]xfade=transition=fade:duration=0.45:offset=6.5,format=yuv420p[v]",
  ].join(";"),
  "-map",
  "[v]",
  "-t",
  "10.2",
  "-r",
  "30",
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "18",
  "-movflags",
  "+faststart",
  output,
];

const result = spawnSync(ffmpeg, args, { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
