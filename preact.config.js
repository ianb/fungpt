/* eslint-env node */
import { join } from "path";
import * as fs from "fs";
import * as path from "path";
import * as express from "express";
import bodyParser from "body-parser";
import { createProxyMiddleware } from "http-proxy-middleware";
import { error } from "console";

const IMAGE_DIR = join(__dirname, "user-images");

if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR);
}

module.exports = (config, env, helpers) => {
  const postCssLoaders = helpers.getLoadersByName(config, "postcss-loader");
  postCssLoaders.forEach(({ loader }) => {
    const plugins = loader.options.postcssOptions.plugins;

    // Add tailwind css at the top.
    plugins.unshift(require("tailwindcss"));
    plugins.unshift(require("tailwindcss/nesting"));
  });
  if (config.devServer) {
    config.devServer.onBeforeSetupMiddleware = function (devServer) {
      if (!devServer) {
        throw new Error("webpack-dev-server is not defined");
      }
      const getimgProxy = createProxyMiddleware({
        target: 'https://api.getimg.ai',
        changeOrigin: true,
        logLevel: 'debug', // Enable logging
        pathRewrite: {
          "^/getimg/": "/", // rewrite path
        },
      });
      devServer.app.get("/images/*", serveFiles);
      devServer.app.use("/getimg", getimgProxy);
      // devServer.app.get("/images", express.static(IMAGE_DIR + "/"));
      devServer.app.use(bodyParser.json({ limit: "500mb" }));
      devServer.app.post("/images", saveFile);
      console.log("SERVER SERVER", IMAGE_DIR);
    };
    config.devServer.client.overlay = true;
    config.devServer.client.progress = true;
  }

  return config;
};

async function saveFile(req, res) {
  if (req.body.deleteFile) {
    return deleteFile(req, res);
  }
  let { title, metadata, project, image } = req.body;
  const subdir = normalizeForFilename(project).slice(0, 30);
  const longTitle = normalizeForFilename(title);
  const prefix = currentDate();
  const count = await findCount(subdir, prefix);
  const shortFilename = longTitle.slice(0, 40);
  const fullFilename = `${prefix}-${shortFilename}-${count}`;
  const decodedContent = Buffer.from(image, 'base64');
  await fs.promises.writeFile(path.join(IMAGE_DIR, subdir, fullFilename + ".jpg"), decodedContent);
  metadata = metadata || {};
  const jsonContent = JSON.stringify(metadata, null, 2);
  await fs.promises.writeFile(path.join(IMAGE_DIR, subdir, fullFilename + ".json"), jsonContent);
  res.json({
    url: `/images/${subdir}/${fullFilename}.jpg`,
    metadataUrl: `/images/${subdir}/${fullFilename}.json`,
    bytes: decodedContent.length,
    fullFilename,
  });
  console.log("saved to", fullFilename,)
}

async function deleteFile(req, res) {
  let { title, metadata, project, image, fullFilename } = req.body;
  const subdir = normalizeForFilename(project).slice(0, 30);
  const path1 = path.join(IMAGE_DIR, subdir, fullFilename + ".jpg");
  const path2 = path.join(IMAGE_DIR, subdir, fullFilename + ".json");
  let success = true;
  try {
    await fs.promises.unlink(path1);
  } catch (e) {
    console.warn("Error unlinking path", path1, e);
    success = false;
  }
  try {
    await fs.promises.unlink(path2);
  } catch (e) {
    console.warn("Error unlinking path", path2, e);
    success = false;
  }
  res.json({
    success,
    fullFilename,
  });
  console.log("deleted", fullFilename);
}

function normalizeForFilename(string) {
  let s = string.replace(/\s/g, "-");
  s = s.replace(/[^A-Za-z0-9_-]/g, "");
  s = s.replace(/-+/g, "-");
  s = s.replace(/^-+/, "").replace(/-+$/, "");
  return s.replace(/[^A-Za-z0-9_-]/g, "_");
}

function currentDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

async function findCount(subdir, prefix) {
  const path = join(IMAGE_DIR, subdir);
  if (!(await exists(path))) {
    await fs.promises.mkdir(path);
    return 1;
  }
  const files = await fs.promises.readdir(path);
  const counts = files.filter((f) => f.startsWith(prefix)).map((f) => {
    const ns = f.slice(prefix.length + 1).split("-");
    const n = ns[ns.length - 1];
    const nInt = parseInt(n, 10);
    if (isNaN(nInt)) {
      return 0;
    } else {
      return nInt;
    }
  });
  const count = Math.max(...counts);
  return count + 1;
}

async function exists(path) {
  try {
    await fs.promises.access(path);
    return true;
  } catch (e) {
    return false;
  }
}

function serveFiles(req, res) {
  let p = req.params[0];
  p = path.join(IMAGE_DIR, p);
  res.sendFile(p);
}
