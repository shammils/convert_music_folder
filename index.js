const klaw = require('klaw');
const spawn = require('child_process').spawn;
const fs = require('fs-extra');
const path = require('path');

// if your target drive doesnt have enough space, thats on you
const inDir = '/home/kisama/Music/_incoming';
const outDir = '/home/kisama/Music/_outgoing';

// TODO? support more than flac? thats all I have so whatever
const sourceFormat = 'flac';
const targetFormat = 'ogg';

// I rather include unwanted files than possibly exclude wanted files
const bannedOtherFileTypes = [
  '.cue',
  '.db',
  '.log',
  '.m3u8',
  '.thumb',
  '.accurip'
]

let audioCount = 0;
let audioCompeleted = 0;
const albums = {}; // we are assuming the top level folder is an album for now
let albumCount = 0;
let albumsCompleted = 0;
let dump = [];

const delay = ms =>
  new Promise(resolve =>
    setTimeout(() => resolve(), ms));

(async () => {
  await fs.ensureDir(outDir);
  // only wrote this for handling the massive jcore library
  /*await getAlbumFile();
  console.log(Object.keys(albums).length);
  if (!albums || !Object.keys(albums).length) {
    await scanDir();
    organizeFiles();
  }
  await fs.writeJson('./albums.json', albums);*/
  await scanDir();
  organizeFiles();
  albumCount = Object.keys(albums).length;
  console.log(`${audioCount} files, ${albumCount} albums to clone`);
  await cloneAlbums();
})();

async function getAlbumFile() {
  try {
    albums = await fs.readJson('./albums.json');
  } catch {
  }
  return;
}

async function cloneAlbums() {
  const stack = [];
  const inDirObj = path.parse(inDir);
  const folderNames = Object.keys(albums);
  for (let i = 0; i < folderNames.length; i++) {
    stack.push(albums[folderNames[i]])
    while (stack.length) {
      let currentFolder = stack.pop();
      // process folder files
      const newFolderPath = `${outDir}${currentFolder.path.split(inDirObj.base)[1]}`;
      await fs.ensureDir(newFolderPath);
      for (let j = 0; j < currentFolder.audioFiles.length; j++) {
        const fileObj = path.parse(currentFolder.audioFiles[j]);
        await convertAudioFile(
          currentFolder.audioFiles[j],
          `${newFolderPath}/${fileObj.name}.${targetFormat}`
        );
        audioCompeleted += 1;
        console.log(`${audioCount-audioCompeleted} tracks left`)
      }
      for (let j = 0; j < currentFolder.otherFiles.length; j++) {
        const fileObj = path.parse(currentFolder.otherFiles[j]);
        await copyFile(
          currentFolder.otherFiles[j],
          `${newFolderPath}/${fileObj.base}`
        );
      }
      // add nested folders to the stack if any
      const folderNames = Object.keys(currentFolder.folders);
      for (let j = 0; j < folderNames.length; j++) {
        stack.push(currentFolder.folders[folderNames[j]])
      }
    }
    albumsCompleted+=1
    console.log(`completed album "${folderNames[i]}"`)
  }
  console.log(`${albumsCompleted} albums, ${audioCompeleted} songs processed`)
}

let iterations = 0;
function organizeFiles() {
  const inDirObj = path.parse(inDir);
  console.log(`dump file count ${dump.length}`)
  let i = dump.length;
  while (i--) {
    console.log(`${i} on path `, dump[i])
    const fileObj = path.parse(dump[i]);
    const pathArr = dump[i].split(inDirObj.base)[1].split('/');
    pathArr.splice(0,1);
    const currentFolder = recurseAlbum(albums[pathArr[0]],pathArr,0);
    if (currentFolder) {
      // ran into path.parse results that were all fucked up, lets just parse
      // the last item in the array to clean things up
      const lastObj = path.parse(pathArr[pathArr.length-1]);
      if (!lastObj.ext.length) {
        // directory
        if (!currentFolder.folders[fileObj.base]) {
          // dont overwrite
          currentFolder.folders[fileObj.base] = {
            path: dump[i],
            audioFiles: [],
            otherFiles: [],
            folders: {},
          }
        }

        dump.splice(i, 1)
      } else {
        // file
        // TODO: support other lossless formats maybe?? dont care
        if (lastObj.ext.toLowerCase().endsWith(sourceFormat)) {
          if (currentFolder.audioFiles.indexOf(dump[i]) === -1) {
            currentFolder.audioFiles.push(dump[i]);
            audioCount += 1;
          }
          dump.splice(i, 1)
        } else if (!bannedOtherFileTypes.includes(lastObj.ext.toLowerCase())) {
          if (currentFolder.otherFiles.indexOf(dump[i]) === -1) {
            currentFolder.otherFiles.push(dump[i]);
          }
          dump.splice(i, 1)
        }else {
          // remove unwanted file
          dump.splice(i, 1)
        }
      }
    }
  }

  if (!dump.length) {
    console.log(`completed organization after ${iterations} iterations`);
    return;
  }
  // basically, we better not encounter n levels of nesting, because shit damn
  if (dump.length && iterations > 10) {
    // we failed to parse all the thingiess
    console.log(`${dump.length} files left, quitting the process`);
    console.log(`
${Object.keys(albums).length} albums parsed
${audioCount} songs parsed`);
  } else {
    console.log('parsing all files again');
    iterations += 1;
    organizeFiles();
  }
}

function recurseAlbum(folder, arr, index) {
  if ((index+2) < arr.length) {
    if (!folder) return;
    return recurseAlbum(folder.folders[arr[index+1]], arr, index+1);
  } else {
    return folder;
  }
}

async function scanDir() {
  const inDirObj = path.parse(inDir);
  const promise = new Promise(resolve =>
    klaw(inDir)
      .on('data', item => {
        const fileObj = path.parse(item.path);
        console.log('path',item.path);
        // ignore base directory
        if (item.path !== inDir) {
          if (fileObj.dir.endsWith(inDirObj.base)) {
            // create album
            const album = {
              path: item.path,
              audioFiles: [],
              otherFiles: [],
              folders: {},
            };
            albums[fileObj.base] = album;
          } else {
            dump.push(item.path);
          }
        }
      })
      .on('end', () => resolve()));
    return promise;
}

async function convertAudioFile(source, target) {
  console.log(`source:${source}, target:${target}`);
  const promise = new Promise((resolve, reject) => {
    const p = spawn('sox', [source, target]);
    p.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    p.stderr.on('data', (data) => {
      if (data.indexOf('sox WARN dither') > -1) {

      } else {
        console.error(data);
      }
      //console.error(`stderr: ${data}`);
    });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else {
        throw `received code ${code} attempting to covert audio`
        resolve(); // fuck it for now
      }
    });
  });
  return promise;
}

async function copyFile(from, to) {
  const promise = new Promise((resolve, reject) => {
    const p = spawn('cp', [from, to]);
    p.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    p.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else {
        console.log(`received code ${code} attempting to copy file ${from},${to}`)
        resolve();
      }
    });
  });
  return promise;
}
