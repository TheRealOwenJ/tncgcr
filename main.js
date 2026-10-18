import { createInterface } from "node:readline";
import { send, get } from "./sendandreceive.js";
import * as banner from "./banner.js";

const settingzFile = Bun.file("./settingz.json");
let settingz = await settingzFile.json();
let refreshing = false;

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

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
    console.error("\n\x1b[31mcan't connect to the server!\x1b[0m");
    console.log("check your connection or change the server in settingz.json");
    return;
  }

  Object.keys(response).forEach((key) => {
    if (key > settingz["lastseen"]) {
      newMessages = true;
      if (first) {
        process.stdout.clearLine(0);
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

  if (newMessages && prompt)
    process.stdout.write(
      `${{ r: "\x1b[31m", g: "\x1b[32m", b: "\x1b[34m" }[settingz.username.match(/!(.*?)!/)?.[1]] || ""}@${settingz.username.replace(/!.*?!/g, "")}> \x1b[0m`,
    );

  if (Object.keys(response).length > 0)
    settingz["lastseen"] = Math.max(...Object.keys(response).map(Number));
  writeSettingz();
}

banner.printBanner();

if ((await settingz["username"]) === "") {
  console.log(
    "you haven't set a username yet! (use !r! for red, and the same for green and blue!)",
  );
  console.log("for example: !r!coolguy99");
  settingz["username"] = await new Promise((resolve) => {
    readline.question("username: ", resolve);
  });
  console.log("");
  writeSettingz();
}

updatePrompt();

console.log("connecting to the server...");
try {
  await get();
} catch {
  console.error("\n\x1b[31mcan't connect to the server!\x1b[0m");
  console.log(
    "maybe try changing to another server in the settingz.json file?",
  );
  process.exit(1);
}

console.log("done!");
console.log("\ncatching up on messages:");
await refresh(false);

console.log("done!");
console.log("");
console.log("type !help for commands!");

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
  } else if (answer === "!help") {
    console.log("commands:");
    console.log("!info; prints backstory");
    console.log("!whoami; shows info about yourself");
    console.log("!changeun; change username and/or colortag");
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
