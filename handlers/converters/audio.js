const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { tempPath } = require('../../utils/tempFiles');

ffmpeg.setFfmpegPath(ffmpegPath);

function convertFormat(inputPath, format) {
  return new Promise((resolve, reject) => {
    const out = tempPath(`.${format}`);
    ffmpeg(inputPath)
      .toFormat(format)
      .on('end', () => resolve(out))
      .on('error', reject)
      .save(out);
  });
}

function trim(inputPath, startSec = 0, durationSec = 30) {
  return new Promise((resolve, reject) => {
    const out = tempPath('.mp3');
    ffmpeg(inputPath)
      .setStartTime(startSec)
      .setDuration(durationSec)
      .on('end', () => resolve(out))
      .on('error', reject)
      .save(out);
  });
}

function boostVolume(inputPath, factor = 1.5) {
  return new Promise((resolve, reject) => {
    const out = tempPath('.mp3');
    ffmpeg(inputPath)
      .audioFilters(`volume=${factor}`)
      .on('end', () => resolve(out))
      .on('error', reject)
      .save(out);
  });
}

module.exports = { convertFormat, trim, boostVolume };
