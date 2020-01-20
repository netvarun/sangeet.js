//command to run the file
//ls -1 *file.txt | xargs -t -n1 node combine.js

const fs = require('fs');
const readline = require('readline');
const execSync = require('child_process').execSync;

if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " path/to/file");
    process.exit(-1);
}
 
const path = process.argv[2];
 
let rl = readline.createInterface({
    input: fs.createReadStream(path)
});

let line_no = 0;
let combFile = path;
combFile = combFile.replace('_file.txt','_combined.m4a');

let aacComb = combFile;
aacComb = aacComb.replace('m4a','aac');

// event is emitted after each line
rl.on('line', function(line) {
    line_no++;
    console.log('Processing: ' + line);

	//Convert the files
	let m4afile = line.replace(/file (.*)/i,'$1');
	let aacfile = m4afile;
	aacfile = aacfile.replace('m4a','aac');

	const aacCmd = 'ffmpeg -y -i ' + m4afile + ' -acodec copy ' + aacfile;
	console.log("Converting... - " + aacCmd);
	execSync(aacCmd);

	//Concatenate the files
	const catCmd = 'cat ' + aacfile + ' >>' + aacComb;
	console.log("Concatenating... - " + catCmd);
	execSync(catCmd);

});

// end
rl.on('close', function(line) {
	//Combine
	const combCmd = 'ffmpeg -y -i ' + aacComb + ' -acodec copy -bsf:a aac_adtstoasc ' + combFile;
	console.log("Combining... - " + combCmd);
	execSync(combCmd);
});

