'use strict';

const readline = require('readline');
const fs = require('fs');
const execSync = require('child_process').execSync;
const csv = require('csv-parser');
const fsExtra = require('fs-extra');
const path = require('path')

const dir = "run_" + Math.floor(Date.now() / 1000);

if (process.argv.length <= 2) {
    console.log("Usage: node sangeet.js PATH_TO_SONG_LIST.csv");
    process.exit(-1);
}
const csvFile = process.argv[2];
 

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const songs = [];
var curAct = -1;
var curScene = -1;
var oldAct = -1;
var oldScene = -1;
var curCt = 0;
var totalLen = 0;

function parseStr(str) {
    str = str.toLowerCase();
    str = str.replace(/[^0-9a-z]/gi, '_');
    return str;
}

fs.createReadStream(csvFile)
  .pipe(csv())
  .on('data', (data) => songs.push(data))
  .on('end', () => {
/*
  { song: 'Kummi Adi',
    youtube: 'https://www.youtube.com/watch?v=1Mx1Znd0BZg',
    act: '3',
    scene: '3',
    group: 'Couple Dance',
    start_time: '',
    stop_time: '',
    fade_in: '',
    fade_out: '',
    pos: ''
     } ]
*/



          totalLen = songs.length;
songs.forEach(function(obj) {
    curCt++;
    obj.id = obj.youtube;
    obj.song = parseStr(obj.song);
    obj.group = parseStr(obj.group);

    curAct = obj.act;
    curScene = obj.scene;

    obj.id = (obj.id).replace(/.*\?v=(.*)/i,'$1');
    const cache = "cache/" + obj.id + ".m4a";

    const songName = dir + "/" + "act" + obj.act + "_scene" +  obj.scene + "_pos" + obj.pos + "_group_" + obj.group + "_song_" + obj.song + "_original.m4a";
    const trimmedName = dir + "/" + "act" + obj.act + "_scene" +  obj.scene + "_pos" + obj.pos + "_group_" + obj.group + "_song_" + obj.song + "_trimmed.m4a";
    const fadedName = dir + "/" + "act" + obj.act + "_scene" +  obj.scene + "_pos" + obj.pos + "_group_" + obj.group + "_song_" + obj.song + "_faded.m4a"; 
//    const fadedNameMp3 = dir + "/" + "act" + obj.act + "_scene" +  obj.scene + "_pos" + obj.pos + "_group_" + obj.group + "_song_" + obj.song + "_faded.mp3"; 
    const fadedNameNoDir = "act" + obj.act + "_scene" +  obj.scene + "_pos" + obj.pos + "_group_" + obj.group + "_song_" + obj.song + "_faded.m4a"; 

    const fileList = dir + "/" + "act" + obj.act + "_scene" +  obj.scene + "_group_" + obj.group + "_file.txt"; 
    const combinedName = dir + "/" + "act" + obj.act + "_scene" +  obj.scene + "_group_" + obj.group + "_combined.m4a"; 

    //skip empty 
    if(obj.id == "") {
        return;
    }
    const ytCmd = 'youtube-dl -f bestaudio[ext=m4a] ' + obj.youtube + ' --output "' + cache + '"';
    //console.log(obj.id);
    //console.log(ytCmd);

	//check to see if file exists
	if (!fs.existsSync(cache)) {
        console.log("Song does not exist - " + obj.song + " - downloading: " + ytCmd);
        execSync(ytCmd);
	}
	if (fs.existsSync(cache)) {
        console.log("File successfully downloaded");
        fsExtra.copySync(path.resolve(__dirname,'./' + cache), path.resolve(__dirname,'./' + songName));
        console.log("File copied - " + songName);

        if(obj.start_time != "" && obj.stop_time != "") {
            const trimCmd = 'ffmpeg -y -i ' + songName + ' -ss ' + obj.start_time  + ' -to ' + obj.stop_time  + ' -c copy ' + trimmedName;
            const fadeCmd = 'ffmpeg -y -i ' + trimmedName + ' -filter_complex "afade=d=' + obj.fade_in  + ', areverse, afade=d='+ obj.fade_out  +', areverse" ' + fadedName; 
            console.log("Trimming and fading..");
            console.log(trimCmd);
            execSync(trimCmd);
            console.log(fadeCmd);
            execSync(fadeCmd);

           /*
            console.log("Converting to mp3");
            const convertMp3 = 'ffmpeg -i ' + fadedName + ' -codec:a libmp3lame -qscale:a 0 ' + fadedNameMp3;
            console.log(convertMp3);
            execSync(convertMp3);
            */

            fs.appendFileSync(fileList, 'file ' + fadedNameNoDir + '\n');

            /*
            if((! (curAct == oldAct && curScene == oldScene )) || curCt == totalLen  ) {
                console.log("Flushing - combining files");
                const combCmd = 'ffmpeg -f concat -safe 0 -i ' + fileList + ' -c copy ' + combinedName;
                console.log(combCmd);
                execSync(combCmd);

            }
            */

        }

	}
    else {
        consle.log("File Failed to Download!");
    }

    //Update old - since it's now been processed
    oldAct = obj.act;
    oldScene = obj.scene;
    
    });

  });

