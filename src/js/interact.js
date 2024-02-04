/*+++++++++++++++++++Basic functions+++++++++++++++++++*/

//button function for the csv divider pop up
function showCSVDeviderPopUp() {
  document.getElementById("CSVDeviderPopUp").style.display = "block";
}

/**
 * This function will get the value of the CSV devider from the input field and return it.
 * If the input field is empty, it will return a comma.
 * @returns {string} - The CSV devider.
 */
function getCSVDevider() {
  let devider = document.getElementById("myCSVDeviderInput").value;
  if (devider == "") {
    devider = ",";
  }
  return devider;
}

/**
 * This function will hide the input-area and the buttons
 * leave the page for the result
 */
function hideprepera() {
  let prepareObj = document.getElementById("prepare");
  prepareObj.style.display = "none";
}

/**
 * This function reads the real time window size and
 * is responsible for the dynamic adjustment.
 */
function showresult() {
  let resultObj = document.getElementById("result");
  let mapWindows = document.getElementById("chartContainer");
  resultObj.style.display = "flex";

  let scaFactor = mapPreview();
  mapWindows.style.transform = "scale(" + scaFactor + ")";
  let leftbias = (1330 * (1 - scaFactor)) / 2 - 10;
  let topbias = (760 * (1 - scaFactor)) / 2 - 10;
  console.log("bias", leftbias);

  mapWindows.style.left = "-" + leftbias + "px";
  mapWindows.style.top = "-" + topbias + "px";
}

/**
 * This function reads the content of the text box area and
 * removes empty lines in the end.
 */
function getinputdata() {
  let textinput = document.getElementById("text_box").value;

  const lastChar = textinput.slice(-1);
  const secondLastChar = textinput.slice(-2, -1);

  if (lastChar === "\n" && secondLastChar !== "\r") {
    // Remove the last newline character(s)
    textinput = textinput.slice(0, -2);
  } else if (lastChar === "\r") {
    textinput = textinput.slice(0, -1);
  }

  if (textinput == "") {
    return false;
  } else {
    // Split the input into an array of lines and consider both \r and \n as newline characters
    return textinput;
  }
}
/**
 * This function reads the content from an uploaded file and
 * shows it in the text area.
 */
function readFileContents() {
  let fileInput = document.getElementById("dataFile");
  let file = fileInput.files[0];
  if (file && (file.name.endsWith(".csv") || file.name.endsWith(".json"))) {
    var reader = new FileReader();

    reader.onload = function (e) {
      // Display or process the contents of the CSV file here
      var csvContent = e.target.result;
      let textBox = document.getElementById("text_box");
      textBox.value = csvContent;
      //alert('Data uploaded successfully!\n\nCSV Content:\n' + csvContent);
    };

    reader.readAsText(file);

    if (file.name.endsWith(".json")) {
      document.getElementById("directRun").style.display = "inline";
    }
  } else {
    alert("Please select a valid CSV file.");
  }
}

/**
 * This function selects data types and
 * generates distance functions for each type.
 */
function selectDataType() {
  let data_type = document.getElementById("DataType").value;
  let fun_slector = document.getElementById("D_function");
  let distance_func_list = new Array();

  switch (data_type) {
    case "noChoice":
      fun_slector.style.display = "none";
      break;
    case "Seq":
      distance_func_list = ["For sequence", "Hamming", "edit-distance"];
      break;
    case "ChemInfo":
      distance_func_list = ["For chemicial data", "Tanimoto"];
      break;
    case "Vector":
      distance_func_list = ["earth-dist", "Euclidean"];
      break;
    case "Custom":
      distance_func_list = ["Custom"];
      break;
    case "Preclustered":
      distance_func_list = ["Preclustered"];
    default:
      fun_slector.style.display = "none";
      break;
  }
  return distance_func_list;
}

/**
 *
 * @param {*} distance_func_list :This function list was completed according to data types.
 * It generates a speific function selector.
 */

function changedistancefunclist(distance_func_list) {
  let fun_slector = document.getElementById("D_function");

  //information(names) we display in the dropdown menu for the distance functions
  let func_dic = {
    Seq: "example for sequence",
    ChemInfo: "example for chemical data",
    Hamming: "Hamming Distance",
    Tanimoto: "Tanimoto Distance",
    Euclidean: "Euclidean Distance",
    "earth-dist": "Earth Distance",
    "edit-distance": "Edit Distance (unit cost)",
    Custom: "Custom",
    Preclustered: "Preclustered",
  };

  for (let i = 0; i < distance_func_list.length; i++) {
    let fun_obt = document.createElement("option");
    fun_obt.value = distance_func_list[i];
    fun_obt.text = func_dic[distance_func_list[i]];
    fun_slector.appendChild(fun_obt);
  }
  fun_slector.style.display = "";
}

/**
 * This function makes sure, that there must be no repetitive selectors.
 */
function clean_fun_slector() {
  let fun_slector = document.getElementById("D_function");
  fun_slector.options.length = 1;
}
function showZoomAutoPopup() {
  if (document.getElementById("CustomZoomPopUp").style.display == "block") {
    document.getElementById("CustomZoomPopUp").style.display = "none";
  }
  document.getElementById("AutoZoomPopUp").style.display = "block";
}
function showZoomCustomPopup() {
  if (document.getElementById("AutoZoomPopUp").style.display == "block") {
    document.getElementById("AutoZoomPopUp").style.display = "none";
  }
  document.getElementById("CustomZoomPopUp").style.display = "block";
}

function getAutoZoomlevel() {
  let zoomLevel = document.getElementById("AutoZoomInput").value;
  if (zoomLevel == "") {
    zoomLevel = "20";
  }
  return parseInt(zoomLevel);
}

function getCustomZoomlevel() {
  let clustPerLevel = document.getElementById("CustomZoomInput").value;
  if (clustPerLevel == "") {
    clustPerLevel = "20";
  }
  return parseInt(clustPerLevel);
}

function getZoomMode() {
  var zoomMode = 0;
  if (document.getElementById("CustomZoomPopUp").style.display == "block") {
    zoomMode = 1;
  }
  return zoomMode;
}

/*
 * When the text area is not empty, this function will read the content and check if the first line is a title line.
 */
function getTitleLine(InputFlag = "coord") {
  console.log("trying to get the title Title line from", InputFlag, "data");
  let inhalt = document.getElementById("text_box").value;
  let lines = inhalt.split("\n");
  let devider = getCSVDevider();
  let firstline = lines[0].split(devider);
  let titleline = new Array();
  console.log("first line is:", firstline);
  let dimension = firstline.length;
  let havetitle = new Boolean(false);
  //check if the first line is a title line
  switch (InputFlag) {
    case "coord":
      for (let m = 0; m < dimension; m++) {
        if (parseFloat(firstline[m])) {
          continue;
        } else {
          havetitle = true;
          break;
        }
      }
      break;
    case "molecur":
      break;
    default:
      havetitle = false;
      break;
  }

  //if no titleline detected, then use the default title
  if (havetitle == true) {
    console.log("title line detected");
    titleline = firstline;
  } else {
    console.log("using default title");
    titleline = Array.from({ length: dimension }, (v, x) => x + 1);
  }
  console.log(titleline);
  return titleline;
}

/*This function creates the drop-down menu accroding to the title line */
function CreateColFlagSelector(idx = 0, titleline) {
  let ColFlagMenu = document.createElement("select");
  let firstOption = document.createElement("option");
  let dimension = titleline.length;
  firstOption.value = "noColFlag";
  firstOption.text = "select a column flag";
  for (let i = 0; i < dimension; i++) {
    let flagOption = document.createElement("option");
    flagOption.value = titleline[i];
    flagOption.text = titleline[i];
    ColFlagMenu.appendChild(flagOption);
  }
  ColFlagMenu.options[idx].selected = true;
  return ColFlagMenu;
}

/** This function will check the first line and delete the axises 
function isCoordindat(txt_inhalt, devider = ",") {
  let coorindat = [];
  if (txt_inhalt != "") {
    let lines = txt_inhalt.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      line = line.split(",");
      if (line.length == 2 && parseFloat(line[0]) && parseFloat(line[1])) {
        coorindat.push(line.toString());
      }
    }
  }
  if (coorindat.length > 0) {
    return coorindat.toString;
  }
  return "";
}
*/

//choose flags for each column
function flag_preset() {
  let preset_flag = document.createElement("select");
  let first_flag = document.createElement("option");
  let flag_list = [
    "name",
    "distance information",
    "non-numerical flags",
    "numericial flags",
  ];

  first_flag.value = "noChoice";
  first_flag.text = "choose a flag";
  preset_flag.appendChild(first_flag);
  for (let i = 0; i < 4; i++) {
    let flag = flag_list[i];
    let _option = document.createElement("option");
    _option.value = flag;
    _option.text = flag;
    preset_flag.appendChild(_option);
  }
  return preset_flag;
}

/**
 * This function shows the promoting message and matches the flags.
 */
function ColFlagCheck() {
  document.getElementById("checkFlagArea").style.display = "";
  let titleline = getTitleLine((InputFlag = "coord"));
  let checkContainer = document.getElementById("checkFlagArea");
  let checklist = document.getElementById("checkTable");
  let dimension = titleline.length;
  let rows = checklist.getElementsByTagName("tr");
  while (rows.length > 1) {
    checklist.deleteRow(-1);
  }

  let guide_info = document.getElementById("flag_guide");
  guide_info.innerHTML =
    dimension +
    " Columns are detected in your file. \
    </br> Please choose for every column, that you want to use, one of the following flags: </br> \
  1. Name </br> 2. Distance information </br> 3. Non-numerical flags </br> 4. Numericial flags";

  for (let d = 1; d < dimension + 1; d++) {
    let _check_tr = checklist.insertRow();
    let cell_1 = _check_tr.insertCell(0);
    let cell_2 = _check_tr.insertCell(1);
    let cell_3 = _check_tr.insertCell(2);
    let ColFlagSelector = CreateColFlagSelector(d - 1, titleline);
    let flag_menu = flag_preset();
    cell_1.textContent = "the " + d + " Column is:";
    cell_2.appendChild(ColFlagSelector);
    cell_3.appendChild(flag_menu);
  }
  checkContainer.appendChild(checklist);
}

/* Fullscreen in-Place */
function MapViewSwitcher() {
  let mapWindows = document.getElementById("chartContainer");
  /* Enter full screen */
  if (mapWindows.requestFullscreen) {
    mapWindows.requestFullscreen();
  } else if (mapWindows.mozRequestFullScreen) {
    /* Firefox */
    mapWindows.mozRequestFullScreen();
  } else if (mapWindows.webkitRequestFullscreen) {
    /* Chrome, Safari and Opera */
    mapWindows.webkitRequestFullscreen();
  } else if (mapWindows.msRequestFullscreen) {
    /* IE/Edge */
    mapWindows.msRequestFullscreen();
  }
  /* Exit full-screen */
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    /* Firefox */
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    /* Chrome, Safari and Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    /* IE/Edge */
    document.msExitFullscreen();
  }
}

/*+++++++++++++++++++++++ function for buttons ++++++++++++++++++++ */

/**
 * This function will get the selected columns from the dropdown menus and return them.
 * @returns {Array} - An array containing the selected columns. The first element is the data columns, the second element is the numerical flags and the third element is the non-numerical flags.
 * The selected columns are stored as the index of the column in the CSV file.
 */
function getSelectedColumns() {
  let table = document.getElementById("checkTable");
  let rows = table.getElementsByTagName("tr");
  let selectedDataColumns = [];
  let selectedNumFlagColumns = [];
  let selectedNonNumFlagColumns = [];
  for (let i = 1; i < rows.length; i++) {
    let row = rows[i];
    if (
      row.cells[2].getElementsByTagName("select")[0].value ==
      "distance information"
    ) {
      select = row.cells[1].querySelector("select");
      selectedDataColumns.push(select.selectedIndex);
    } else if (
      row.cells[2].getElementsByTagName("select")[0].value == "numericial flags"
    ) {
      select = row.cells[1].querySelector("select");
      selectedNumFlagColumns.push(select.selectedIndex);
    } else if (
      row.cells[2].getElementsByTagName("select")[0].value ==
      "non-numerical flags"
    ) {
      select = row.cells[1].querySelector("select");
      selectedNonNumFlagColumns.push(select.selectedIndex);
    }
  }
  return [
    selectedDataColumns,
    selectedNumFlagColumns,
    selectedNonNumFlagColumns,
  ];
}

/**
 * This function will get the names of the flag columns from the header of the CSV file and return them.
 * @param {string} header - The header of the CSV file.
 * @param {Array} nonnumIndices - The indices of the non-numerical flag columns.
 * @param {Array} numIndices - The indices of the numerical flag columns.
 * @returns {Array} - An array containing the names of the flag columns. The first element is the names of the non-numerical flag columns and the second element is the names of the numerical flag columns.
 */

function getFlagColumnNames(header, nonnumIndices, numIndices) {
  header = header.split(",");
  let flagColumnNames = [];
  let tmp = [];
  nonnumIndices.forEach((index) => {
    tmp.push(header[index]);
  });
  flagColumnNames.push(tmp);
  let tmp2 = [];
  numIndices.forEach((index) => {
    tmp2.push(header[index]);
  });
  flagColumnNames.push(tmp2);

  return flagColumnNames;
}

/**
 * This function reads the user input on the selected columns.
 *
 * @param {Array} lines - The data from the text box.
 * @param {string} devider - The divider used in the CSV file.
 * @param {Array} selectedColumns - The selected columns from the dropdown menus. selectedColumns[0] = data columns, selectedColumns[1] = numerical flags, selectedColumns[2] = non-numerical flags.
 * @returns {Array} - An array containing the data from the text box. The first element is the data columns, the second element is the numerical flags and the third element is the non-numerical flags.
 */

function readDataFromLines(lines, devider, selectedColumns, dataType) {
  let points_array = [];
  let numflags_array = [];
  let nonnumflags_array = [];
  let line = "";
  let foundValues = [];
  //decide if pointsarray has to store the data as arrays or not
  let storeAsArray = false;
  if (dataType == "Custom" || dataType == "Vector") {
    storeAsArray = true;
  }
  //iterate over the lines and split them by the devider but ignore the first line
  for (let i = 1; i < lines.length; i++) {
    line = lines[i].split(devider);
    foundValues = [];
    if (storeAsArray) {
      selectedColumns[0].forEach((columnIndex) => {
        foundValues.push(line[columnIndex]);
      });
      points_array.push(foundValues);
      foundValues = [];
    } else {
      selectedColumns[0].forEach((columnIndex) => {
        points_array.push(line[columnIndex]);
      });
    }
    selectedColumns[1].forEach((flagIdxName) => {
      //throw error if the value is not a number
      number = parseFloat(line[flagIdxName]);
      if (isNaN(number)) {
        alert(
          `All numflag values must be valid numbers. number "${
            number + 1
          }" in line ${i}, column ${flagIdxName + 1} was invalid`,
        );
      }
      if (isNaN(number)) {
        assert(!isNaN(number), "All numflag values must be valid numbers");
      }
      foundValues.push(number);
    });
    numflags_array.push(foundValues);
    foundValues = [];

    selectedColumns[2].forEach((flagIdxName) => {
      foundValues.push(line[flagIdxName]);
    });
    nonnumflags_array.push(foundValues);
  }

  return [points_array, numflags_array, nonnumflags_array];
}

/**
 * This function calls up the result with the map.
 */
function dealwithrun() {
  //get all the user input from buttons and text-areas
  let functionFlag = document.getElementById("D_function").value;
  let dataType = document.getElementById("DataType").value;
  let scalingMethod = parseInt(document.getElementById("Scaling_alg").value);
  let distMethod = parseInt(document.getElementById("Distance_calcu").value);
  let zoomMode = getZoomMode();
  var zoomNumber = 20;
  if (zoomMode == 0) {
    zoomNumber = getAutoZoomlevel();
  }
  if (zoomMode == 1) {
    zoomNumber = getCustomZoomlevel();
    if (document.getElementById("CustomZoomInput").value.includes("e")) {
      zoomMode = 2;
    }
  }

  var lines = getinputdata().split(/\r?\n/);
  var devider = getCSVDevider();
  var selectedColumns = getSelectedColumns();
  //get names of the header columns for the flag columns
  var flagColumnNames = getFlagColumnNames(
    lines[0],
    selectedColumns[2],
    selectedColumns[1],
  );

  //DER SWITCH CASE KOMMT WEG SOBALD cluster.js REFACTORED IST
  //AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
  //AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
  var type = "default";
  switch (functionFlag) {
    case "noChoice":
      alert("Please choose a distance function");
      break;
    case "Custom":
      type = "custom";
      console.log("function is custom");
      break;
    case "earth-dist":
    case "Euclidean":
      type = "euclidean";
      if (functionFlag == "earth-dist") {
        type = "earth-dist";
      }
      break;
    case "Preclustered":
      type = "preclustered";
      console.log("preclustered");
      break;
    case "edit-distance":
    case "Tanimoto":
      //TODO
      //refactor this delete switch case
      type = "tanimotoFingerprints";
      if (functionFlag == "edit-distance") {
        type = "edit-distance";
      }
      console.log("function as Tani");
      break;
    case "Hamming":
      break;
    default:
      console.log("Input data doesn't match the distance function");
  }
  //AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
  //AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

  // read the data from the text area and store it in the arrays
  let points_array = [];
  let numflags_array = [];
  let nonnumflags_array = [];

  [points_array, numflags_array, nonnumflags_array] = readDataFromLines(
    lines,
    devider,
    selectedColumns,
    dataType,
  );
  //KANN DAS WEG?
  if (points_array[points_array.length - 1] == undefined) {
    points_array.pop();
  }
  // initialize the next step which is the calculation of the clusters
  hideprepera();
  showresult();
  calculateClusters(
    points_array,
    type,
    nonnumflags_array,
    numflags_array,
    scalingMethod,
    distMethod,
    flagColumnNames,
    zoomMode,
    zoomNumber,
  );
}

/**
 * This function resets all the inputs and the settings.
 */
function deletedatenandfunc() {
  let weep = confirm("Delete all the data and the chosen function?");
  if (weep) {
    document.getElementById("text_box").value = "";
    document.getElementById("flag_guide").innerHTML = "";
    document.getElementById("checkFlagArea").style.display = "none";
    document.getElementById("DataType").selectedIndex = 0;
    document
      .getElementById("D_function")
      .setAttribute("style", "display: none");
  }
}

// Import JSON file and call mapFunctions
function importFile() {
  // Read Textbox
  var data = JSON.parse(getinputdata());

  // Hide elements
  hideprepera();
  showresult();

  // Call map
  mapFunctions(data[0], data[1], data[2], data[3], data[4]);
}
