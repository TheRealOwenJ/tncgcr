import { createInterface } from "node:readline";
import { send, get } from "./sendandreceive.js";
import * as banner from "./banner.js";
import createPlayer from "play-sound";

const settingzFile = Bun.file("./settingz.json");
let settingz = await settingzFile.json();
let refreshing = false;

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const sound = createPlayer({
  players: [
    "mpv",
    "mplayer",
    "afplay",
    "mpg123",
    "mpg321",
    "play",
    "cvlc",
    "powershell",
  ],
});

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  orange: "\x1b[38;5;208m",
  green: "\x1b[32m",
  gray: "\x1b[90m",
  purple: "\x1b[35m",
};

const messages = [
  "for another poor soul has entered the spookynet...",
  "do not look behind your terminal...",
  "something is listening and it isnt an http server...",
  "the spirits of the dead chatters have been DYING to talk to someone...",
  "prepare for utter chaos...",
];

function intro() {
  printcolor("orange", messages[Math.floor(Math.random() * messages.length)]);
}

function printcolor(color, msg) {
  console.log(colors[color] + msg + colors["reset"]);
}

readline.on("SIGINT", () => {
  console.log("\n\ngoodbye!\n");
  process.exit(0);
});

function updatePrompt() {
  readline.setPrompt(
    `${{ r: "\x1b[31m", g: "\x1b[32m", b: "\x1b[34m" }[settingz.username.match(/!(.*?)!/)?.[1]] || ""}@${settingz.username.replace(/!.*?!/g, "")}> \x1b[0m`,
  );
}

function writeSettingz() {
  Bun.write("./settingz.json", JSON.stringify(settingz, null, 2));
}

async function refresh(prompt = true) {
  let response;
  let first = true;
  let newMessages = false;

  try {
    response = await get();
  } catch {
    console.error("\n\x1b[31mcan't connect to the spookynet!\x1b[0m");
    console.log(
      "check your connection or try changing the server in settingz.json!",
    );
    printcolor("red", "or maybe don't try chatting with demons at 3am ;]");
    return;
  }

  Object.keys(response).forEach((key) => {
    if (key > settingz["lastseen"]) {
      newMessages = true;
      if (first) {
        if (process.stdout.isTTY) {
          process.stdout.clearLine(0);
        }
        first = false;
      }

      process.stdout.write("\r");
      if (response[key]["user"] !== settingz["username"]) {
        const color = response[key]["user"].match(/!(.*?)!/)?.[1];
        let un = "@" + response[key]["user"].replace(/!.*?!/g, "") + ": ";
        if (color) {
          if (color === "r") {
            un = `\x1b[31m${un}\x1b[0m`;
          } else if (color === "g") {
            un = `\x1b[32m${un}\x1b[0m`;
          } else if (color === "b") {
            un = `\x1b[34m${un}\x1b[0m`;
          }
        }
        console.log(un + response[key]["key"]);
      }
    }
  });

  if (newMessages && prompt) {
    process.stdout.write(
      `${{ r: "\x1b[31m", g: "\x1b[32m", b: "\x1b[34m" }[settingz.username.match(/!(.*?)!/)?.[1]] || ""}@${settingz.username.replace(/!.*?!/g, "")}> \x1b[0m`,
    );
  }

  if (
    newMessages &&
    Object.keys(response).some(
      (key) =>
        key > settingz.lastseen && response[key].user !== settingz.username,
    )
  ) {
    sound.play("./notif.mp3", (err) => {
      if (err) {
        printcolor("gray", "the spirits are silent...");
      }
    });
  }

  if (Object.keys(response).length > 0)
    settingz["lastseen"] = Math.max(...Object.keys(response).map(Number));
  writeSettingz();
}

banner.printBanner();

if ((await settingz["username"]) === "") {
  console.log(
    "you haven't named your vessel yet! (use !r! for red, and the same for green and blue!)",
  );
  console.log("for example: !r!coolguy99");
  settingz["username"] = await new Promise((resolve) => {
    readline.question("username: ", resolve);
  });
  console.log("");
  writeSettingz();
}

updatePrompt();

console.log("🕯️  connecting to the spookynet...🕯️");
try {
  await get();
} catch {
  console.error("\n\x1b[31mcan't connect to the spookynet!\x1b[0m");
  console.log(
    "maybe try changing to another spookynet in the settingz.json file?",
  );
  printcolor("red", "or is your client haunted???");
  process.exit(1);
}

console.log("");
console.log("finished.\n");
intro();
console.log("\nchecking the tombs for missed messages:");
await refresh(false);

console.log("finished.");
console.log("");
console.log("type !HELPME for commands!");

readline.prompt();

readline.on("line", async (answer) => {
  if (answer === "!info") {
    console.log(
      "tncgcr: totally not chaotic global chat room is a insecure-as-hell chaosfest of a chatroom;",
    );
    console.log(
      "the usernames arent secured, the entire chat is logged in plain json, this entire thing is is an IT nightmare!",
    );
    console.log(
      "but i think that is what makes it unique: chaos isnt always too bad!",
    );
  } else if (answer === "!HELPME") {
    printcolor("red", "🎃 === forbidden knowledge === 🎃");
    printcolor("purple", "!info; uncover the origins of tncgcr");
    printcolor("purple", "!whoami; discover your vessel");
    printcolor("purple", "!changeun; change your identity and/or colortag");
    printcolor("purple", "!clear; banish the terminal contents");
  } else if (answer === "!changeun") {
    console.log("don't forget the color codes! !r!, !g! and !b!");
    settingz["username"] = await new Promise((resolve) => {
      readline.question("new username: ", resolve);
    });
    writeSettingz();
    updatePrompt();
  } else if (answer === "!clear") {
    console.clear();
  } else if (answer === "!whoami") {
    console.log("========================================");
    console.log(
      `you are <${{ r: "\x1b[31m", g: "\x1b[32m", b: "\x1b[34m" }[settingz.username.match(/!(.*?)!/)?.[1]] || ""}@${settingz.username.replace(/!.*?!/g, "")}\x1b[0m>`,
    );
    console.log("homeserver: " + settingz["endpoint"]);
    console.log("========================================");
  } else {
    await send(answer, settingz["username"]);
  }
  readline.prompt();
});

setInterval(async () => {
  if (refreshing) {
    return;
  }
  refreshing = true;
  try {
    await refresh();
  } finally {
    refreshing = false;
  }
}, settingz["refreshrate"] * 1000);
