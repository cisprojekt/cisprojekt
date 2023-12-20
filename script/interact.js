/*+++++++++++++++++++Basic functions+++++++++++++++++++*/

function hideprepera(){
    let prepareObj = document.getElementById("prepare");
    prepareObj.style.display='none';
};

function showprepare(){
    let prepareObj = document.getElementById("prepare");
    prepareObj.style.display='block';
};

function hideresult(){
    let resultObj = document.getElementById("result");
    resultObj.style.display='none';
};

function showresult(){
    let resultObj = document.getElementById("result");
    resultObj.style.display='flex';
};

function getinputdata(){
    let textinput = document.getElementById("text_box").value;
    if(textinput==""){
        return false;
    }
    else{
        return textinput;
    }
};

function readFileContents(){
    let fileInput = document.getElementById("dataFile");
    let file = fileInput.files[0];
    if (file && file.name.endsWith('.csv')){
        var reader = new FileReader();

        reader.onload = function (e) {
            // Display or process the contents of the CSV file here
            var csvContent = e.target.result;
            let textBox = document.getElementById('text_box');
            textBox.value=csvContent;
            //alert('Data uploaded successfully!\n\nCSV Content:\n' + csvContent);
        };

        reader.readAsText(file);
    } else {
        alert('Please select a valid CSV file.');
    }
}

function getfunctionflag(){
    let funcSelector= document.getElementById("D_function");
    let funcIndex=funcSelector.selectedIndex;
    let funcFlag=funcSelector.options[funcIndex].value;
    return funcFlag;
};

/** This will check the first line and delete the axises */
function isCoordindat(txt_inhalt){
    let coorindat = [];
    if(txt_inhalt != ""){
        let lines = txt_inhalt.split('\n');
        console.log(lines.length);
        for(let i = 0; i < lines.length; i++){
            let line = lines[i];
            line =  line.split(',');
            if(line.length ==2 && parseFloat(line[0]) && parseFloat(line[1])){
                console.log("coord found");
                coorindat.push(line.toString());
            }
        }
    }
    if(coorindat.length > 0){
        console.log("get");
        return coorindat.toString;
    }
    return "";
} 

function isSequence(txt_inhalt, matchflag){

}

function isInChI(txt_inhalt, matchflag){
    
}

/* Fullscreen in-Place */

function MapViewSwitcher(){
    let clusterBox = document.getElementById("InforArea");
    let mapWindows = document.getElementById("chartContainer");
    let switchbutton = document.getElementById("switchbtn");
    if(switchbutton.innerHTML == "Full Screen"){
        mapWindows.style.transform = "scale(1)";
        mapWindows.style.left = "0px";
        mapWindows.style.top = "10px";
        clusterBox.style.display = "none";
        switchbutton.innerHTML = "Exit Full Screen";
        return 0;
    }else{
        mapWindows.style.transform = "scale(0.6)";
        mapWindows.style.left = "-260px";
        mapWindows.style.top = "-120px";
        clusterBox.style.display = "";
        switchbutton.innerHTML = "Full Screen";
        return 0;
    }
}



/*+++++++++++++++++++ functions from other grupps +++++++++++++++++++*/ 
let wasmReady = new Promise(resolve => {
    Module.onRuntimeInitialized = resolve;
});

async function initializeMap(inputPoints) {
    await wasmReady;
    console.log("Starting Clustering Program");
    let pointsToPlot = [];
    n = inputPoints.length / 2; // TODO make this dynamic with dimension
    console.log(n);
    console.log("Module loaded");
    dim = 2;
    zoomLevels = 10;
    maxIterations = 5;

    points = new Float64Array(n * dim);

    for (let i = 0; i < n * dim; i++) {
        points[i] = parseFloat(inputPoints[i]);
    }
    
    console.log(points);

    let pointsBuf = Module._malloc(n * dim * Float64Array.BYTES_PER_ELEMENT);
    let distMatBuf = Module._malloc(
        ((n * (n - 1)) / 2) * Float64Array.BYTES_PER_ELEMENT,
    );
    let heightBuf = Module._malloc(
        (n - 1) * Float64Array.BYTES_PER_ELEMENT,
    );
    let mergeBuf = Module._malloc(
        2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT,
    );
    let labelsBuf = Module._malloc(
        n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );

    Module.HEAPF64.set(points, pointsBuf / points.BYTES_PER_ELEMENT);

    Module.ccall(
        "clusterPoints",
        null,
        [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
        ],
        [
        pointsBuf,
        dim,
        distMatBuf,
        heightBuf,
        mergeBuf,
        labelsBuf,
        n,
        maxIterations,
        zoomLevels,
        1
        ],
    );

    let labelsResult = new Int32Array(
        Module.HEAP32.subarray(
        labelsBuf / Int32Array.BYTES_PER_ELEMENT,
        labelsBuf / Int32Array.BYTES_PER_ELEMENT + n * zoomLevels,
        ),
    );
    let pointsResult = new Float64Array(
        Module.HEAPF64.subarray(
        pointsBuf / Float64Array.BYTES_PER_ELEMENT,
        pointsBuf / Float64Array.BYTES_PER_ELEMENT + n * dim,
        ),
    );

    for (var i = 0; i < n * 2; i += 2) {
        pointsToPlot.push({ x: pointsResult[i], y: pointsResult[i + 1] });
    }

    console.log(labelsResult);
    Module._free(pointsBuf);
    Module._free(distMatBuf);
    Module._free(heightBuf);
    Module._free(mergeBuf);
    Module._free(labelsBuf);
    
    mapFunctions(labelsResult, pointsToPlot, n);
};
    //var script = document.createElement('script');
    //script.src = 'map.js';
    //document.head.appendChild(script);

/*+++++++++++++++++++++++ function for buttons ++++++++++++++++++++ */


function dealwithrun(){
    let punktdata = "";
    let matchflag = new Boolean();
    let functionFlag = getfunctionflag();

    //read data from text box
    punktdata = getinputdata();
    // Split the CSV content into lines considering CR and LF as line endings
    var lines = punktdata.split(/\r?\n/);
    // Assuming the first line contains headers

    // gotta be careful here, if the first line is not the header, this will fail
    var headers = lines[0].split(',');

    var data_for_map = [];


    switch(functionFlag){
        case 'noChoice':
            alert("Please choose a distance function");
            break;
        case 'Euclidean':
            //check if the data is coordinate data
            //
            console.log("function as Euc");
            punktdata = isCoordindat(punktdata);
            if(Boolean(punktdata)){
                console.log("match the euc")
            }
            else{
                console.log("empty data or data dosen't match");
            }
            //cluster the data
            //initailize flattened array from lines
            //igone the header
            for(let i = 1; i < lines.length; i++){
                let line = lines[i].split(',');
                for(let j = 0; j < line.length; j++){
                    data_for_map.push(line[j]);
                }
            }



            break;
        case 'Tanimoto':
            console.log("function as Tani");
            break;
        case 'Hamming':
            // Initialize an array to store the objects
            flags = [];
            nucleotideData = []
            for (var i = 1; i < lines.length; i++) {
                var nucleotides = lines[i].split(',');
                nucleotideData.push(nucleotides[0]);
                //store the flags
                for (var j = 1; j < nucleotides.length; j++) {
                    flags.push(nucleotides[j]);
                }
            }
            //initialize array with pointers to the strings as Uint8Arrays
            const string_array = nucleotides.map(
                str => new Uint8Array(str.split('').map(c => c.charCodeAt(0))));
            //allocate memory for each string in the array
            const charPtrs = string_array.map(chars => {
                const ptr = Module._malloc(chars.length * chars.BYTES_PER_ELEMENT);
                Module.HEAPU8.set(chars, ptr);
                return ptr;
            });
            //allocate memory for the array of pointers
            const ptrBuf = Module._malloc(charPtrs.length * Int32Array.BYTES_PER_ELEMENT);

            // Copy the array of pointers to the allocated memory
            Module.HEAP32.set(charPtrs, ptrBuf / Int32Array.BYTES_PER_ELEMENT);

            //call the distance matrix function
            //returns the pointer to the result array
            let resultPtr2 = Module.ccall('calculateHammingDistanceMatrix', 'number', ['number','number','number'], [ptrBuf, nucleotides.length, nucleotides[0].length]);

            //create a typed array from the pointer containing the distmat as flattened array
            let hamdistmat = new Int32Array(Module.HEAP32.buffer, resultPtr2, nucleotides.length*(nucleotides.length+1)/2);
            
            for (let i = 0; i < (nucleotides.length*(nucleotides.length+1)/2); i++) {
                console.log(hamdistmat[i]);
            }

            Module._free(ptrBuf);

            break;
        default:
            console.log("Input data doesn't match the distance function");
    }

    if(matchflag){
        
        hideprepera();
        showresult();
        initializeMap(data_for_map);
    } 
    else{
        alert("Input data dosen't match the distance function");
        return false;
    }
    
    /*Send Data and functionflag to IV-Grupp*/
    /*Should get sth back and send to Map-Gruppp, denn initialis the Map*/

    /*Hied the test-area and buttons*/
    /*Show Cluster list and map */
    
};

function deletedatenandfunc(){
    let weep = confirm("Are you sure to weep all the data and choosen function?");
    if(weep){
        document.getElementById("text_box").value="";
    }
};

function back2input(){
    hideresult();
    showprepare();
}

