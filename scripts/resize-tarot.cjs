const sharp = require("sharp");
sharp(process.argv[2])
  .resize({ width: 200, withoutEnlargement: true })
  .webp({ quality: 52 })
  .toFile(process.argv[3])
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
