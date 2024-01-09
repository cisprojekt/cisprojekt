/*+++++++++++++++++++Basic functions+++++++++++++++++++*/

function hideprepera() {
  let prepareObj = document.getElementById("prepare");
  prepareObj.style.display = "none";
}

function showprepare() {
  let prepareObj = document.getElementById("prepare");
  prepareObj.style.display = "block";
}

function hideresult(){
  let resultObj = document.getElementById("result");
  let switchbutton = document.getElementById("switchbtn");
  resultObj.style.display='none';
  if(switchbutton.innerHTML == "Full Screen"){
      mapWindows.style.transform = "scale(1)";
      mapWindows.style.left = "0px";
      mapWindows.style.top = "10px";
      clusterBox.style.display = "none";
      switchbutton.innerHTML = "Exit Full Screen";
  }
  return 0;
};

function showresult() {
  let resultObj = document.getElementById("result");
  resultObj.style.display = "flex";
}

function getinputdata() {
  let textinput = document.getElementById("text_box").value;
  if (textinput == "") {
    return false;
  } else {
    return textinput;
  }
}

function readFileContents() {
  let fileInput = document.getElementById("dataFile");
  let file = fileInput.files[0];
  if (file && file.name.endsWith(".csv")) {
    var reader = new FileReader();

    reader.onload = function (e) {
      // Display or process the contents of the CSV file here
      var csvContent = e.target.result;
      let textBox = document.getElementById("text_box");
      textBox.value = csvContent;
      //alert('Data uploaded successfully!\n\nCSV Content:\n' + csvContent);
    };

    reader.readAsText(file);
  } else {
    alert("Please select a valid CSV file.");
  }
}

function getfunctionflag() {
  // goofy ahh code 💀
  let funcSelector = document.getElementById("D_function");
  let funcIndex = funcSelector.selectedIndex;
  let funcFlag = funcSelector.options[funcIndex].value;
  return funcFlag;
}

/*When text-area not empty, will read the inhalt and check if the first line is the title line */
function getTitleLine(InputFlag = "coord"){
  console.log("trying to get the title Title line from", InputFlag, "data");
  let inhalt = document.getElementById("text_box").value;
  let lines = inhalt.split('\n');
  let firstline = lines[0].split(',');
  let titleline = new Array();
  console.log("first line is:", firstline);
  let dimension = firstline.length;
  let havetitle = new Boolean(false);
  //check if the first line is title line
  switch (InputFlag){
      case 'coord':
          for(let m = 0; m < dimension; m++){
              if(parseFloat(firstline[m])){
                  continue;
              }
              else{
                  
                  havetitle = true;
                  break;
              }
          }
          break;
      case 'molecur':
          break;
      default:
          havetitle = false;
          break;         
  }

  //if no titleline detected, then use the default title
  if(havetitle == true){
      console.log("title line detected");
      titleline = firstline;
  }
  else{
      console.log("using default title");
      titleline = Array.from({length: dimension}, (v, x) => x+1);
  }
  console.log(titleline);
  return titleline;
}

/*Creat the drop-down Menu accroding to the title line */
function CreateColFlagSelector(idx=0,titleline){
  console.log("creating the ColFlag selector accroding to the titleline", titleline);
  let ColFlagMenu = document.createElement("select");
  let firstOption = document.createElement("option");
  let dimension = titleline.length;
  firstOption.value = "noColFlag";
  firstOption.text = "select a colum flag";
  for(let i = 0; i < dimension; i++){
      let flagOption = document.createElement("option");
      flagOption.value = titleline[i];
      flagOption.text = titleline[i];
      ColFlagMenu.appendChild(flagOption);
  }
  ColFlagMenu.options[idx].selected = true;
  return ColFlagMenu;
}

/** This will check the first line and delete the axises */
function isCoordindat(txt_inhalt) {
  let coorindat = [];
  if (txt_inhalt != "") {
    let lines = txt_inhalt.split("\n");
    console.log(lines.length);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      line = line.split(",");
      if (line.length == 2 && parseFloat(line[0]) && parseFloat(line[1])) {
        console.log("coord found");
        coorindat.push(line.toString());
      }
    }
  }
  if (coorindat.length > 0) {
    console.log("get");
    return coorindat.toString;
  }
  return "";
}

function isSequence(txt_inhalt, matchflag) {}

function isInChI(txt_inhalt, matchflag) {}

//choos flags for each colum
function flag_preset(){
  let preset_flag = document.createElement("select");
  let first_flag = document.createElement("option");
  let flag_list = ["name", "distance information", "numerical additional information", "non-numericial additional information"];
  
  first_flag.value = "noChoice";
  first_flag.text = "choose a flag";
  preset_flag.appendChild(first_flag);
  for(let i = 0; i<4;i++){
    let flag = flag_list[i];
    let _option = document.createElement("option");
    _option.value = flag;
    _option.text = flag;
    preset_flag.appendChild(_option);
  }
  return preset_flag
}
function ColFlagCheck(){
  document.getElementById("checkFlagArea").style.display = "";
  let titleline = getTitleLine(InputFlag = "coord");
  let checkContainer = document.getElementById("CheckContainer");
  let checklist = document.getElementById("checkTable");
  let dimension = titleline.length;
  let rows = checklist.getElementsByTagName('tr');
  while(rows.length > 1){
      checklist.deleteRow(-1);
  }

  for(let d = 1; d < dimension+1; d++){
      console.log(d+" Cloumn");
      let _check_tr = checklist.insertRow();
      let cell_1 = _check_tr.insertCell(0);
      let cell_2 = _check_tr.insertCell(1);
      let cell_3 = _check_tr.insertCell(2);
      let ColFlagSelector = CreateColFlagSelector(d-1, titleline);
      let flag_menu = flag_preset();
      cell_1.textContent = 'the '+(d)+' Colum is:';
      cell_2.appendChild(ColFlagSelector);
      cell_3.appendChild(flag_menu);
  }
  checkContainer.appendChild(checklist);
}

/* Fullscreen in-Place */

function MapViewSwitcher() {
  let clusterBox = document.getElementById("InforArea");
  let mapWindows = document.getElementById("chartContainer");
  let switchbutton = document.getElementById("switchbtn");
  if (switchbutton.innerHTML == "Full Screen") {
    mapWindows.style.transform = "scale(1)";
    mapWindows.style.left = "0px";
    mapWindows.style.top = "10px";
    clusterBox.style.display = "none";
    switchbutton.innerHTML = "Exit Full Screen";
    return 0;
  } else {
    mapWindows.style.transform = "scale(0.6)";
    mapWindows.style.left = "-260px";
    mapWindows.style.top = "-120px";
    clusterBox.style.display = "";
    switchbutton.innerHTML = "Full Screen";
    return 0;
  }
}

/*+++++++++++++++++++++++ function for buttons ++++++++++++++++++++ */

function getDataColumns(d_function_value) {
  let dataColumns = {};

  if (d_function_value == "noChoice" || !d_function_value) {
    return dataColumns;
  }

  let dropdownId = d_function_value + "-dropdowns";
  var dropdownContainer = document.getElementById(dropdownId);
  var selectElements = dropdownContainer.querySelectorAll("select");

  if (d_function_value == "Euclidean") {
    // Euclidean dict has axesArray key with all the column indices of the axes, since it might have any n number of data columns,
    // meaning the number of data columns is not fixed like for any other distance function.
    let axesArray = [];
    selectElements.forEach(function (selectElement) {
      // Get the index of the selected option
      var selectedIndex = selectElement.selectedIndex;
      // Access the selected option using the selectedIndex
      var selectedOption = selectElement.options[selectedIndex];
      // selectedValue = idx of the column
      var selectedValue = selectedOption.value;
      axesArray.push(selectedValue);
    });
    dataColumns["axesArray"] = axesArray;
    return dataColumns;
  } else {
    selectElements.forEach(function (selectElement) {
      // Get the ID of the select element (e.g., "x", "y", "z")
      var selectId = selectElement.id;

      // Get the index of the selected option
      var selectedIndex = selectElement.selectedIndex;

      // Access the selected option using the selectedIndex
      var selectedOption = selectElement.options[selectedIndex];

      // selectedValue = idx of the column
      var selectedValue = selectedOption.value;

      // Populate the dataColumns object with the selectId as key and selectedValue as value
      // e.g., dataColumns["x"] = 0, that is the 0th column is the x-column
      dataColumns[selectId] = selectedValue;
    });
  }

  return dataColumns;
}

function dealwithrun() {
  let punktdata = "";
  let matchflag = new Boolean();
  let functionFlag = getfunctionflag();
  let d_function_value = functionFlag;

  let dataColumnsDict = getDataColumns(d_function_value);

  //read data from text box
  punktdata = getinputdata();
  // Split the CSV content into lines considering CR and LF as line endings
  var lines = punktdata.split(/\r?\n/);
  // Assuming the first line contains headers

  // gotta be careful here, if the first line is not the header, this will fail
  var headers = lines[0].split(",");

  var points_array = [];

  var type = "default";
  switch (functionFlag) {
    case "noChoice":
      alert("Please choose a distance function");
      break;
    case "Euclidean":
      type = "euclidean";
      //check if the data is coordinate data
      //
      console.log("function as Euc");
      punktdata = isCoordindat(punktdata);
      if (Boolean(punktdata)) {
        console.log("match the euc");
      } else {
        console.log("empty data or data dosen't match");
      }
      //cluster the data
      //initailize non-flattened (nested) array from lines
      //ignore the header
      for (let i = 1; i < lines.length; i++) {
        let line = lines[i].split(",");
        let lineAxisValues = [];
        dataColumnsDict["axesArray"].forEach((columnIndex) => {
          lineAxisValues.push(line[columnIndex]);
        });
        points_array.push(lineAxisValues);
      }
      break;
    case "Tanimoto":
      console.log("function as Tani");
      break;
    case "Hamming":
      // Initialize an array to store the objects
      flags = [];
      nucleotideData = [];
      for (var i = 1; i < lines.length; i++) {
        var nucleotides = lines[i].split(",");
        nucleotideData.push(nucleotides[0]);
        //store the flags
        for (var j = 1; j < nucleotides.length; j++) {
          flags.push(nucleotides[j]);
        }
      }
      //initialize array with pointers to the strings as Uint8Arrays
      const string_array = nucleotides.map(
        (str) => new Uint8Array(str.split("").map((c) => c.charCodeAt(0))),
      );
      //allocate memory for each string in the array
      const charPtrs = string_array.map((chars) => {
        const ptr = Module._malloc(chars.length * chars.BYTES_PER_ELEMENT);
        Module.HEAPU8.set(chars, ptr);
        return ptr;
      });
      //allocate memory for the array of pointers
      const ptrBuf = Module._malloc(
        charPtrs.length * Int32Array.BYTES_PER_ELEMENT,
      );

      // Copy the array of pointers to the allocated memory
      Module.HEAP32.set(charPtrs, ptrBuf / Int32Array.BYTES_PER_ELEMENT);

      //call the distance matrix function
      //returns the pointer to the result array
      let resultPtr2 = Module.ccall(
        "calculateHammingDistanceMatrix",
        "number",
        ["number", "number", "number"],
        [ptrBuf, nucleotides.length, nucleotides[0].length],
      );

      //create a typed array from the pointer containing the distmat as flattened array
      let hamdistmat = new Int32Array(
        Module.HEAP32.buffer,
        resultPtr2,
        (nucleotides.length * (nucleotides.length + 1)) / 2,
      );

      for (
        let i = 0;
        i < (nucleotides.length * (nucleotides.length + 1)) / 2;
        i++
      ) {
        console.log(hamdistmat[i]);
      }

      Module._free(ptrBuf);

      break;
    default:
      console.log("Input data doesn't match the distance function");
  }

  if (matchflag) {
    hideprepera();
    showresult();
    initializeMap(points_array, type);
  } else {
    alert("Input data dosen't match the distance function");
    return false;
  }

  /*Send Data and functionflag to IV-Grupp*/
  /*Should get sth back and send to Map-Gruppp, denn initialis the Map*/

  /*Hied the test-area and buttons*/
  /*Show Cluster list and map */
}

function deletedatenandfunc() {
  let weep = confirm("Are you sure to weep all the data and choosen function?");
  if (weep) {
    document.getElementById("text_box").value = "";
  }
}

function back2input() {
  hideresult();
  showprepare();
}

/*+++++++++++++++++++++++ function for sdropdowns ++++++++++++++++++++ */
function showDropdowns() {
  var selectedFunction = document.getElementById("D_function").value;
  var csvInput = document.getElementById("text_box").value;

  var firstLine = csvInput.split("\n")[0];
  var columns = firstLine.split(",");

  // Hide all dropdown containers
  var dropdownContainers = document.querySelectorAll(".dropdown-container");
  dropdownContainers.forEach(function (container) {
    container.classList.remove("visible");
  });

  // Show the dropdown container corresponding to the selected function
  if (selectedFunction !== "noChoice") {
    var selectedContainer = document.getElementById(
      selectedFunction + "-dropdowns",
    );
    var flagsContainer = document.getElementById("Flags-dropdowns");
    if (selectedContainer) {
      selectedContainer.classList.add("visible");
      // Dynamically populate dropdown options based on columns
      var dropdowns = selectedContainer.querySelectorAll("select");
      dropdowns.forEach(function (dropdown) {
        // Clear existing options
        dropdown.innerHTML = "";

        // Populate dropdown options based on columns
        // option.value is the idx of the column
        // option.textContent is the user input name of the column
        var idx = 0;
        columns.forEach(function (column) {
          var option = document.createElement("option");
          option.value = idx; // Assuming you want to use the idx as the option value
          option.textContent = column.trim(); // Assuming you want to display the column value as the option text
          dropdown.appendChild(option);
          idx++;
        });
      });
      //same for flags
      flagsContainer.classList.add("visible");
      var dropdowns = flagsContainer.querySelectorAll("select");
      dropdowns.forEach(function (dropdown) {
        // Clear existing options
        dropdown.innerHTML = "";
        var idx = 0;
        columns.forEach(function (column) {
          var option = document.createElement("option");
          option.value = idx; // Assuming you want to use the column value as the option value
          option.textContent = column.trim(); // Assuming you want to display the column value as the option text
          dropdown.appendChild(option);
          idx++;
        });
      });
    }
  }
}

// Add a new dimension to the Euclidean dropdowns
function addDimension() {
  // Get the dropdown container
  var dropdownContainer = document.getElementById("Euclidean-dropdowns");

  // Create a new label and select element
  var label = document.createElement("label");
  var select = document.createElement("select");

  // Set the properties of the label and select elements
  label.textContent = "x" + (dropdownContainer.children.length + 1) / 2 + ":"; // will be x1, x2, x3, ... weird implementation but it works
  select.id = "dimension-" + (dropdownContainer.children.length + 1) / 2;
  select.name = select.id;
  // Append the label and select elements to the dropdown container
  dropdownContainer.appendChild(label);
  dropdownContainer.appendChild(select);

  // Call the function to populate the dropdown
  showDropdowns();
}

// Remove a dimension from the Euclidean dropdowns
//Not tested yet!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function removeDimension() {
  // Get the dropdown container
  var dropdownContainer = document.getElementById("Euclidean-dropdowns");

  // Remove the last two children (label and select)
  dropdownContainer.removeChild(dropdownContainer.lastChild);
  dropdownContainer.removeChild(dropdownContainer.lastChild);

  // Call the function to populate the dropdown
  showDropdowns();
}

function addFlag() {
  // Get the dropdown container
  var dropdownContainer = document.getElementById("Flags-dropdowns");

  // Create a new label and select element
  var label = document.createElement("label");
  var select = document.createElement("select");

  // Set the properties of the label and select elements
  label.textContent =
    (dropdownContainer.children.length + 1) / 2 + ". Flag" + ":";
  select.id = "flag-" + (dropdownContainer.children.length + 1) / 2;
  select.name = select.id;
  // Append the label and select elements to the dropdown container
  dropdownContainer.appendChild(label);
  dropdownContainer.appendChild(select);

  // Call the function to populate the dropdown
  showDropdowns();
}
