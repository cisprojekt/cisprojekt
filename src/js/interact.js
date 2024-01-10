/*+++++++++++++++++++Basic functions+++++++++++++++++++*/

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
  resultObj.style.display = "none";
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

function getfunctionflag() {
  // goofy ahh code 💀
  let funcSelector = document.getElementById("D_function");
  let funcIndex = funcSelector.selectedIndex;
  let funcFlag = funcSelector.options[funcIndex].value;
  return funcFlag;
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
  //we handle earth-dist and Euclidean the same way might want to change that
  //since earth-dist can only have 2D data (lat,lon)
  if (d_function_value == "earth-dist") {
    dropdownId = "Euclidean-dropdowns";
  }
  var dropdownContainer = document.getElementById(dropdownId);
  var selectElements = dropdownContainer.querySelectorAll("select");

  if (d_function_value == "Euclidean" || d_function_value == "earth-dist") {
    // Euclidean dict has axesArray key with all the column indices of the axes, since it might have any n number of data columns,
    // meaning the number of data columns is not fixed like for any other distance function.
    let axesArray = [];
    selectElements.forEach(function (selectElement) {
      if (selectElement.selectedIndex !== -1) {
        // Get the index of the selected option
        var selectedIndex = selectElement.selectedIndex;
        // Access the selected option using the selectedIndex
        var selectedOption = selectElement.options[selectedIndex];
        // selectedValue = idx of the column
        var selectedValue = selectedOption.value;
        axesArray.push(selectedValue);
      }
    });
    dataColumns["axesArray"] = axesArray;
    return dataColumns;
  } else {
    selectElements.forEach(function (selectElement) {
      if (selectElement.selectedIndex !== -1) {
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
      }
    });
  }

  return dataColumns;
}

function getFlagIdxName(d_function_value, type) {
  //choose the right dropdown container
  let dropdownId = "";
  if (type == "nonnum") {
    dropdownId = "Flags-dropdowns";
  } else {
    dropdownId = "NumericalFlags-dropdowns";
  }

  //return if no function is chosen
  let flagColumns = [];
  if (d_function_value == "noChoice" || !d_function_value) {
    return flagColumns;
  }
  //get the selected column indices
  var dropdownContainer = document.getElementById(dropdownId);
  var selectElements = dropdownContainer.querySelectorAll("select");
  selectElements.forEach(function (selectElement) {
    // Get the index of the selected option
    var selectedIndex = selectElement.selectedIndex;
    var selectedOption = selectElement.options[selectedIndex];
    // selectedValue = idx of the column
    if (selectElement.selectedIndex !== -1) {
      var selectedValue = selectedOption.value;
      outputTuple = [selectedValue, selectedOption.textContent];
      flagColumns.push(outputTuple);
      console.log(outputTuple);
    }
  });
  return flagColumns;
}

function dealwithrun() {
  let punktdata = "";
  let matchflag = true;
  let functionFlag = getfunctionflag();
  let scalingMethod = parseInt(document.getElementById("Scaling_alg").value);
  let d_function_value = functionFlag;

  let dataColumnsDict = getDataColumns(d_function_value);
  let nonnumflagsIdxName = getFlagIdxName(d_function_value, "nonnum");
  let numflagsIdxName = getFlagIdxName(d_function_value, "num");
  console.log(dataColumnsDict);
  console.log(nonnumflagsIdxName);
  console.log(numflagsIdxName);

  //read data from text box
  punktdata = getinputdata();
  // Split the CSV content into lines considering CR and LF as line endings
  var lines = punktdata.split(/\r?\n/);
  // Assuming the first line contains headers

  // gotta be careful here, if the first line is not the header, this will fail
  var headers = lines[0].split(",");

  //arrays for data and flags
  var points_array = [];
  var nonnumflags_array = [];
  var numflags_array = [];

  //assigning flag values to the flags arrays
  //if flagColumns is empty, the array will be empty
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i].split(",");
    let FlagValues = [];
    nonnumflagsIdxName.forEach((flagIdxName) => {
      FlagValues.push(line[flagIdxName[0]]);
    });
    nonnumflags_array.push(FlagValues);
    FlagValues = [];
    numflagsIdxName.forEach((flagIdxName) => {
      //throw error if the value is not a number
      number = parseFloat(line[flagIdxName[0]]);
      if (isNaN(number)) {
        alert(
          `All numflag values must be valid numbers. number "${
            number + 1
          }" in line ${i}, column ${flagIdxName[0] + 1} was invalid`
        );
      }
      assert(!isNaN(number), "All numflag values must be valid numbers");
      FlagValues.push(number);
    });
    numflags_array.push(FlagValues);
  }

  var type = "default";
  var names = []; //will be flags probably
  switch (functionFlag) {
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
      //isCoordindat() does not consider flags TODO make this work;
      //punktdata = isCoordindat(punktdata);
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
      //substitute names with flags
      type = "tanimotoFingerprints";
      console.log("function as Tani");
      for (let i = 1; i < lines.length; i++) {
        let line = lines[i].split(",");
        console.log(line);
        for (let j = 0; j < line.length - 1; j++) {
          data_for_map.push(line[j]);
        }

        names.push(line[line.length - 1]);
      }

      break;
    case "Hamming":
      break;
    default:
      console.log("Input data doesn't match the distance function");
  }

  if (matchflag) {
    hideprepera();
    showresult();
    initializeMap(
      points_array,
      type,
      nonnumflags_array,
      numflags_array,
      scalingMethod
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
  }
}

function back2input() {
  hideresult();
  showprepare();
}

/*+++++++++++++++++++++++ function for sdropdowns ++++++++++++++++++++ */
function showDropdowns() {
  var selectedFunction = document.getElementById("D_function").value;
  //handle earth-dist and Euclidean the same way
  if (selectedFunction == "earth-dist") {
    selectedFunction = "Euclidean";
  }
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
      selectedFunction + "-dropdowns"
    );
    var nonnumflagsContainer = document.getElementById("Flags-dropdowns");
    var numflagsContainer = document.getElementById("NumericalFlags-dropdowns");

    if (selectedContainer) {
      selectedContainer.classList.add("visible");
      // Dynamically populate dropdown options based on columns
      var dropdowns = selectedContainer.querySelectorAll("select");
      dropdowns.forEach(function (dropdown) {
        // Get the currently selected value
        var selectedValue = dropdown.selectedIndex;

        // Clear existing options
        dropdown.innerHTML = "";

        // Populate dropdown options based on columns
        // option.value is the idx of the column
        // option.textContent is the user input name of the column
        var idx = 0;
        columns.forEach(function (column) {
          var option = document.createElement("option");
          option.value = idx; // Assuming you want to use the idx as the option value
          option.textContent = column.trim();

          // Set the selected option if it matches the previously selected value
          if (Number(option.value) === Number(selectedValue)) {
            console.log("selectedValue: " + selectedValue);
            console.log("option.value: " + option.value);
            option.selected = true;
          }

          dropdown.appendChild(option);
          idx++;
        });
        dropdown.selectedIndex = selectedValue;
      });
    }
    //same for flags
    nonnumflagsContainer.classList.add("visible");
    numflagsContainer.classList.add("visible");
    var dropdowns = nonnumflagsContainer.querySelectorAll("select");
    dropdowns.forEach(function (dropdown) {
      var selectedValue = dropdown.selectedIndex;
      // Clear existing options
      dropdown.innerHTML = "";
      var idx = 0;
      columns.forEach(function (column) {
        var option = document.createElement("option");
        option.value = idx; // Assuming you want to use the column value as the option value
        option.textContent = column.trim();
        dropdown.appendChild(option);
        idx++;
      });
      dropdown.selectedIndex = selectedValue;
    });
    var dropdowns = numflagsContainer.querySelectorAll("select");
    dropdowns.forEach(function (dropdown) {
      var selectedValue = dropdown.selectedIndex;
      // Clear existing options
      dropdown.innerHTML = "";
      var idx = 0;
      columns.forEach(function (column) {
        var option = document.createElement("option");
        option.value = idx; // Assuming you want to use the column value as the option value
        option.textContent = column.trim();
        dropdown.appendChild(option);
        idx++;
      });
      dropdown.selectedIndex = selectedValue;
    });
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

function addFlag(flagType) {
  // Get the dropdown container
  var dropdownContainer = document.getElementById(flagType + "-dropdowns");

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
