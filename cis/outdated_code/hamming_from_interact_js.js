/*
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
      */
