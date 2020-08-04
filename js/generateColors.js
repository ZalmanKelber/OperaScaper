const generateColors = (function() {
  const generateColors = num => {
      const rUnits = Math.ceil(Math.cbrt(num));
      const gUnits = Math.ceil(Math.sqrt(num/rUnits));
      const bUnits = Math.ceil((num/rUnits) / gUnits);

      const colorsArray = [];
      for (let i = 0; i < rUnits; i++) {
          for (let j = 0; j < gUnits; j++) {
              for (let k = 0; k < bUnits; k++) {
                      colorsArray.push([Math.round(256 * i / rUnits), Math.round(256 * j / gUnits), Math.round(256 * k / bUnits)]);
              }
          }
      }
      if (num === colorsArray.length) {
          return colorsArray;
      }
      else {
          return reduceArray(colorsArray, num);
      }
  }

  const reduceArray = (prevArray, num) => {
      const remainder = prevArray.length - num;
      const newArray = [];
      for (let i = 0; i < prevArray.length; i++) {
          if (i % (Math.floor(prevArray.length / remainder)) !== 0 || i >= (Math.floor(prevArray.length / remainder) * remainder)) {
              newArray.push(prevArray[i]);
          }
      }
      return newArray;
  }

  return generateColors;
})();
