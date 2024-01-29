/*+++++++++++++++++++Basic functions+++++++++++++++++++*/

//button function for the csv devider pop up
function showCSVDeviderPopUp() {
  document.getElementById("CSVDeviderPopUp").style.display = "block";
}
//function to get the csv devider from the pop up
//default is ","
function getCSVDevider() {
  let devider = document.getElementById("myCSVDeviderInput").value;
  if (devider == "") {
    devider = ",";
  }
  return devider;
}
function hideprepera() {
  let prepareObj = document.getElementById("prepare");
  prepareObj.style.display = "none";
}

function showprepare() {
  let prepareObj = document.getElementById("prepare");
  prepareObj.style.display = "block";
}

function hideresult() {
  let resultObj = document.getElementById("result");
  let switchbutton = document.getElementById("switchbtn");
  resultObj.style.display = "none";
  if (switchbutton.innerHTML == "Full Screen") {
    mapWindows.style.transform = "scale(1)";
    mapWindows.style.left = "0px";
    mapWindows.style.top = "10px";
    clusterBox.style.display = "none";
    switchbutton.innerHTML = "Exit Full Screen";
  }
  return 0;
}

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

function selectDataType() {
  let data_type = document.getElementById("DataType").value;
  let fun_slector = document.getElementById("D_function");
  let distance_func_list = new Array();

  switch (data_type) {
    case "noChoice":
      fun_slector.style.display = "none";
      break;
    case "Seq":
      distance_func_list = ["For sequence", "Hamming"];
      break;
    case "ChemInfo":
      distance_func_list = ["For chemicial data", "Tanimoto"];
      break;
    case "Vector":
      distance_func_list = ["earth-dist", "Euclidean"];
      break;
    default:
      fun_slector.style.display = "none";
      break;
  }
  return distance_func_list;
}

function changedistancefunclist(distance_func_list) {
  let fun_slector = document.getElementById("D_function");

  //information(names) we display in the dropdown menu for the distance functions
  let func_dic = {
    Seq: "example for Sequence",
    ChemInfo: "example for Chemicial data",
    Hamming: "Hamming Distance",
    Tanimoto: "Tanimoto Coefficient",
    Euclidean: "Euclidean Distance",
    "earth-dist": "earth-dist",
  };

  for (let i = 0; i < distance_func_list.length; i++) {
    let fun_obt = document.createElement("option");
    fun_obt.value = distance_func_list[i];
    fun_obt.text = func_dic[distance_func_list[i]];
    fun_slector.appendChild(fun_obt);
  }
  fun_slector.style.display = "";
}

function clean_fun_slector() {
  let fun_slector = document.getElementById("D_function");
  fun_slector.options.length = 1;
}

function getfunctionflag() {
  // goofy ahh code 💀
  let funcSelector = document.getElementById("D_function");
  let funcIndex = funcSelector.selectedIndex;
  let funcFlag = funcSelector.options[funcIndex].value;
  return funcFlag;
}

/*When text-area not empty, will read the inhalt and check if the first line is the title line */
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
  //check if the first line is title line
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

/*Creat the drop-down Menu accroding to the title line */
function CreateColFlagSelector(idx = 0, titleline) {
  console.log(
    "creating the ColFlag selector accroding to the titleline",
    titleline,
  );
  let ColFlagMenu = document.createElement("select");
  let firstOption = document.createElement("option");
  let dimension = titleline.length;
  firstOption.value = "noColFlag";
  firstOption.text = "select a colum flag";
  for (let i = 0; i < dimension; i++) {
    let flagOption = document.createElement("option");
    flagOption.value = titleline[i];
    flagOption.text = titleline[i];
    ColFlagMenu.appendChild(flagOption);
  }
  ColFlagMenu.options[idx].selected = true;
  return ColFlagMenu;
}

/** This will check the first line and delete the axises */
function isCoordindat(txt_inhalt, devider = ",") {
  let coorindat = [];
  if (txt_inhalt != "") {
    let lines = txt_inhalt.split("\n");
    console.log(lines.length);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      line = line.split(",");
      if (line.length == 2 && parseFloat(line[0]) && parseFloat(line[1])) {
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

//choos flags for each colum
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
    " Columns are detected in your file, \
  please choose for every column that you want to ues, one of the following flags: </br> \
  name(1), distance information(2), non-numerical flags(3), numericial flags(4)";

  for (let d = 1; d < dimension + 1; d++) {
    console.log(d + " Cloumn");
    let _check_tr = checklist.insertRow();
    let cell_1 = _check_tr.insertCell(0);
    let cell_2 = _check_tr.insertCell(1);
    let cell_3 = _check_tr.insertCell(2);
    let ColFlagSelector = CreateColFlagSelector(d - 1, titleline);
    let flag_menu = flag_preset();
    cell_1.textContent = "the " + d + " Colum is:";
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
//this function will read the user input on the selected columns on a specific
// "DatenFlag" f.e numerical flags will output all the columns that are selected
// in the dropdown menu for numerical flags
function getDataFromInputTable(datenflag) {
  let table = document.getElementById("checkTable");
  let rows = table.getElementsByTagName("tr");
  let selectedColumns = [];
  for (let i = 1; i < rows.length; i++) {
    let row = rows[i];
    if (row.cells[2].getElementsByTagName("select")[0].value == datenflag) {
      select = row.cells[1].querySelector("select");
      selectedColumns.push(select.selectedIndex);
    }
  }
  return selectedColumns;
}

//get the header names of the flag columns for the clusterInfoBox
//returns an array with 2 elements (non-numerical flags, numerical flags)
//each containing the headers for numflags or nonnumflags
function getFlagColumnNames(header, nonnumIndices, numIndices) {
  header = header.split(",");
  let flagColumnNames = [];
  let tmp = [];
  nonnumIndices.forEach((index) => {
    tmp.push(header[index]);
  });
  flagColumnNames.push(tmp);
  tmp = [];
  numIndices.forEach((index) => {
    tmp.push(header[index]);
  });

  return flagColumnNames;
}

function dealwithrun() {
  let punktdata = "";
  let matchflag = true;
  let functionFlag = getfunctionflag();
  let scalingMethod = parseInt(document.getElementById("Scaling_alg").value);
  let data_type = functionFlag;
  let dataColumns = getDataFromInputTable("distance information");
  console.log("yoyojqaodfjnaqoidjqaiwdipoqwajkdwqwdqwd");
  console.log(scalingMethod);
  console.log(functionFlag);
  console.log(dataColumns);
  console.log(data_type);
  console.log("yoyojqaodfjnaqoidjqaiwdipoqwajkdwqwdqwd");
  //read data from text box
  punktdata = getinputdata();
  // Split the CSV content into lines considering CR and LF as line endings
  var lines = punktdata.split(/\r?\n/);
  //get the devider
  var devider = getCSVDevider();

  var points_array = [];
  var nonnumflags_array = [];
  var numflags_array = [];
  var nonnumflagsIdxName = getDataFromInputTable("non-numerical flags");
  var numflagsIdxName = getDataFromInputTable("numericial flags");
  var flagColumnNames = getFlagColumnNames(
    lines[0],
    nonnumflagsIdxName,
    numflagsIdxName,
  );
  //assigning flag values to the flags arrays
  //if flagColumns is empty, the array will be empty
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i].split(devider);
    let FlagValues = [];
    nonnumflagsIdxName.forEach((flagIdxName) => {
      FlagValues.push(line[flagIdxName]);
    });
    nonnumflags_array.push(FlagValues);
    FlagValues = [];
    numflagsIdxName.forEach((flagIdxName) => {
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
        console.log(line[flagIdxName]);
        assert(!isNaN(number), "All numflag values must be valid numbers");
      }
      FlagValues.push(number);
    });
    numflags_array.push(FlagValues);
  }

  var type = "default";
  switch (data_type) {
    case "noChoice":
      alert("Please choose a distance function");
      break;
    case "earth-dist":
    case "Euclidean":
      type = "euclidean";
      if (functionFlag == "earth-dist") {
        type = "earth-dist";
      }
      //check if the data is coordinate data
      //
      console.log("function as Euc");
      punktdata = isCoordindat(punktdata, devider);
      if (Boolean(punktdata)) {
        console.log("match the euc");
      } else {
        console.log("empty data or data dosen't match");
      }
      //cluster the data
      //initailize non-flattened (nested) array from lines
      //ignore the header
      for (let i = 1; i < lines.length; i++) {
        let line = lines[i].split(devider);
        let lineAxisValues = [];
        dataColumns.forEach((columnIndex) => {
          lineAxisValues.push(line[columnIndex]);
        });
        points_array.push(lineAxisValues);
      }
      console.log(points_array);
      break;
    case "Tanimoto":
      //TODOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
      //TODOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
      //refactor this delete switch case
      type = "tanimotoFingerprints";
      console.log("function as Tani");
      //cluster the data
      //initailize non-flattened (nested) array from lines
      //ignore the header
      for (let i = 1; i < lines.length; i++) {
        let line = lines[i].split(devider);
        let lineAxisValues = [];
        dataColumns.forEach((columnIndex) => {
          points_array.push(line[columnIndex]);
        });
      }
      console.log(points_array);

      break;
    case "Hamming":
      break;
    default:
      console.log("Input data doesn't match the distance function");
  }
  
  if (points_array[points_array.length-1] == undefined) {
    points_array.pop();
  }

  if (matchflag) {
    hideprepera();
    showresult();
    initializeMap(
      points_array,
      type,
      nonnumflags_array,
      numflags_array,
      scalingMethod,
      flagColumnNames,
    );
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
    document.getElementById("flag_guide").innerHTML = "";
    document.getElementById("checkFlagArea").style.display = "none";
    document.getElementById("DataType").selectedIndex = 0;
    document
      .getElementById("D_function")
      .setAttribute("style", "display: none");
  }
}

function back2input() {
  hideresult();
  showprepare();
}
