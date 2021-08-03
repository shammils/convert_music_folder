const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs-extra');

const delay = ms =>
  new Promise(resolve =>
    setTimeout(() => resolve(), ms));

peek();
async function peek() {
  const test = await fs.readJson('./albums.json');
  console.log(test["(Don't say) Goodbye - (Don't say) Goodbye EP [DSGB-0001] (M3-33)"].audioFiles);

  //const real = await fs.readJson('./albums_real.json');
  //console.log(real["(Don't say) Goodbye - (Don't say) Goodbye EP [DSGB-0001] (M3-33)"].audioFiles);
}

//walkFolders();
async function walkFolders() {
  const albums = {
    "Album #1": {
      "path": "/home/kisama/Music/in_test/Folder_0",
      "audioFiles": [],
      "otherFiles": [],
      "folders": {
        "Artwork_1": {
          "path": "/home/kisama/Music/in_test/Folder_0/Artwork",
          "audioFiles": [],
          "otherFiles": [],
          "folders": {
            "#1 Artwork scans": {
              "path": "/home/kisama/Music/in_test/Folder_0/Artwork/Folder_0_1",
              "audioFiles": [],
              "otherFiles": [],
              "folders": {}
            },
            "#1 Artwork backups": {
              "path": "/home/kisama/Music/in_test/Folder_0/Artwork/Folder_0_2",
              "audioFiles": [],
              "otherFiles": [],
              "folders": {}
            }
          }
        },
        "Artwork_2": {
          "path": "/home/kisama/Music/in_test/Folder_0/Folder_1_0",
          "audioFiles": [],
          "otherFiles": [],
          "folders": {
            "#1 Artwork 2 scans": {
              "path": "/home/kisama/Music/in_test/Folder_0/Folder_1_0/Folder_1_1",
              "audioFiles": [],
              "otherFiles": [],
              "folders": {}
            }
          }
        }
      }
    },
    "Album #2: the awesomess": {
      "path": "/home/kisama/Music/in_test/Album #2: the awesomess",
      "audioFiles": [],
      "otherFiles": [],
      "folders": {
        "Artwork": {
          "path": "/home/kisama/Music/in_test/Album #2: the awesomess/Artwork",
          "audioFiles": [],
          "otherFiles": [],
          "folders": {}
        }
      }
    },
  }
  const stack = [];
  Object.keys(albums).forEach(async topLevelFolderName => {
    let currentFolder = albums[topLevelFolderName];
    let name = topLevelFolderName;
    //stack.push(currentFolder);
    let rockBottom = false;
    while(!rockBottom) {
      console.log(`on folder ${name}`, stack.length)
      if (name === 'Artwork_0') {
        //console.log('cf', currentFolder)
      }
      if (currentFolder.folderIndex == null) {
        // untouched folder
        currentFolder.folderIndex = 0;
      }
      // process files here
      // walk folders
      const folderNames = Object.keys(currentFolder.folders);
      console.log(`${name} folders: ${folderNames}`)
      if (folderNames.length > currentFolder.folderIndex) {
        // set the folder index in a different var
        let currentIndex = currentFolder.folderIndex;
        // bump the folder's index
        currentFolder.folderIndex += 1;
        // set the current folder to the past index
        name = folderNames[currentIndex];
        currentFolder = currentFolder.folders[name];
        // push the current folder to the stack
        stack.push(currentFolder);
      } else {
        stack.pop();
        if (stack.length) {
          currentFolder = stack[stack.length-1];
        } else {
          console.log(`completed all folders in album ${topLevelFolderName}`)
          rockBottom = true;
        }
      }
    }
  });

}

async function doDirThing0() {
  const aFile = '/home/user/music/in_test/1/2/3/4/5/6/a_file.flac';
  const baseFolderName = 'in_test';
  const obj = {
    '1': {
      '2': {
        '3': {
          '4': {
            '5': {
              '6': {}
            }
          }
        }
      }
    }
  };
  // lets add aFile to obj.1.2.3.4.5.6
  const folderArr = aFile.split(baseFolderName)[1].split('/');
  folderArr.splice(0,1);
  console.log(folderArr);
  scaleObject(obj, folderArr, 0);
  console.log(JSON.stringify(obj));
  function scaleObject(folder, arr, index) {
    if ((index+2) < arr.length) {
      let thing = folder[arr[index]];
      console.log('current folder', thing);
      return scaleObject(thing, arr, index+1);
    } else {
      console.log('made it to the end');
      folder[arr[index]].thing = arr[index+1];
    }
  }
}
// working
/*
convertAudioFile(
  '/home/kisama/Music/Album #2: the awesomess/01 - Mou Ichido.flac',
  '/home/kisama/Music/node.ogg',
);
async function convertAudioFile(source, target) {
  const promise = new Promise((resolve, reject) => {
    const p = spawn('sox', [source, target]);
    p.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    p.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else {
        console.log(`received code ${code} attempting to covert audio`, {source, target})
        resolve(); // fuck it for now
      }
    });
  });
  return promise;
};
*/
