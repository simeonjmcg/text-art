var imageElem   = $("#imageElem"),
    fgSelect    = $("#fgSelect"),
    bgSelect    = $("#bgSelect"),
    outTextarea = $("#outTextarea"),
    outBtn      = $("#outBtn"),
    fgTextbox   = $("#fgTextbox"),
    bgTextbox   = $("#bgTextbox"),
    newBtn      = $("#newBtn"),
    sizeTextbox = $("#sizeTextbox"),
    undoBtn     = $("#undoBtn"),
    redoBtn     = $("#redoBtn"),
    filledCheck = $("#filledCheck");

var enm = 0;
MouseState = {
  NONE:   -1,
  LEFT:    0,
  RIGHT:   2,
};

var mouseState = MouseState.NONE;
var lastPix;
var undo = [];
var redo = [];
var drawElipse;
var drawRect;
var width = 40;
var height = 20;
var pen = {
  0: [0]
};
var interval = 500;
var tool = 0;
var prevstate;
redraw();

$(document).keydown(function(e) {
  if(e.ctrlKey) {
    if(e.keyCode == 90) {
      undoBtn.click();
    } else if(e.keyCode == 89) {
      redoBtn.click();
    }
  }
});

$(".pen input[type=radio]").click(function(e) {
  console.log(pen);
  pen = JSON.parse($(e.target).val());
});

$(".tool input[type=radio]").click(function(e) {
  tool = parseInt($(e.target).val());
  if(tool == "ellipse" || tool == "rect") {
    filledCheck.show();
  } else {
    filledCheck.hide();
  }
  image.html(prevstate);
});

newBtn.click(function(e) {
  var hwstr = prompt("type the size with the format of #width#x#height#, ex. 20x10.");

  var mat = hwstr.match(/^(\d+)x(\d+)$/);
  width = parseInt(mat[1]);
  height = parseInt(mat[2]);
  redraw();
});
sizeTextbox.keydown(function(e) {
  // Allow: backspace, delete, tab, escape, enter and .
  if($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 || // Allow: Ctrl+A
      (e.keyCode == 65 && e.ctrlKey === true) ||                  // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 39)) /* let it happen, don't do anything. */{
    return;
  }
  // Ensure that it is a number and stop the keypress
  if((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
});
sizeTextbox.keyup(function(e) {
  var num = parseFloat(sizeBtn.val());
  if(isNaN(num)) {
    throw "size is not a number.";
  }
  if(num % 1 !== 0) {
    throw "size is not an integer.";
  }
  if(num > 0) {
    imageElem.css('font-size', num + "px");
  }
});
undoBtn.click(function(e) {
  if(undo.length) {
    redo.push(prevstate);
    image.html(undo.pop());
    prevstate = image.html();
  }
});
redoBtn.click(function(e) {
  if(redo.length) {
    undo.push(prevstate);
    var state = redo.pop();
    image.html(state);
    prevstate = state;
  }
});
resetBtn.click(function(e) {
  if(confirm("are you sure you want to reset the board? you cannot undo this action!")) {
    undo = redo = [];
    redraw();
  }
});
bgSelect.change(function(e) {
  if(bgSelect.val() == "other") {
    bgTextbox.attr("type", "text");
  } else {
    bgTextbox.attr("type", "hidden");
  }
});
fgSelect.change(function(e) {
  if(fgSelect.val() == "other") {
    bgTextbox.attr("type", "text");
  } else {
    bgTextbox.attr("type", "hidden");
  }
});

outBtn.click(function(e) {
  outTextarea.attr({
    "cols": width + 1,
    "rows": height + 1
  })
  imageElem.html(prevstate);
  outTextarea.val(image.text());
});



$(document).mousedown(function(e) {
  mouseState = e.button;
});
$(document).mouseup(function(e) {
  if(tool == 1) {
    if(e.button == 0 || e.button == 2) {
      prevstate = image.html();
    }
  } else if(tool == 2) {
    if(e.button == 0 || e.button == 2) {
      prevstate = image.html();
    }
  } else if(tool == 3) {
    if(e.button == 0 || e.button == 2) {
      prevstate = image.html();
    }
  }
  mouseDown = 0;

  lastPix = null;
});

imageElem.mousedown(function(e) {
  e.preventDefault();
  undo.push(prevstate);
  var parentOffset = image.offset();
  var pval = mapMouseToChar(
    e.pageX - parentOffset.left,
    e.pageY - parentOffset.top
  );
  lastPix = {
    x: pval.x,
    y: pval.y
  };
  redo = [];
});
imageElem.mousemove(function(e) {
  var parentOffset = imageElem.offset();
  var pval = mapMouseToChar(
    e.pageX - parentOffset.left,
    e.pageY - parentOffset.top
  );
  pix = {
    x: pval.x,
    y: pval.y
  };
  var usech;
  if(mouseDown == 2) {
  if(bgSelect.val() == "other") {
    usech = bgTextbox.val().charAt(0);
  } else {
      usech = bgSelect.val();
    }
  } else {
    if(fgSelect.val() == "other") {
      usech = fgTextbox.val().charAt(0);
    } else {
      usech = fgSelect.val();
    }
  }
  if(lastPix) {
    if(mouseDown) {
      switch(tool) {
      case "pen":
        drawLine(lastPix, pix, usech);
        lastPix = pix;
        prevstate = imageElem.html();
        break;
      case "line":
        imageElem.html(prevstate);
        drawLine(lastPix, pix, usech);
        break;
      case "ellipse":
        imageElem.html(prevstate);
        drawElipse(lastPix, pix, usech, filledCheck.prop("checked"));
        break;
      case "rect":
        imageElem.html(prevstate);
        drawRect(lastPix, pix, usech, filledCheck.prop("checked"));
        break;
      }
    } else {
      switch(tool) {
      case "pen":
        imageElem.html(prevstate);
        setPix(pix.x, pix.y, usech);
        break;
      }
    }
  }
});

function redraw() {
  var picstr = "";
  var str = "";
  var usech;
  if(bgSelect.val() == "other") {
    usech = bgTextbox.val().charAt(0);
  } else {
    usech = bgSelect.val();
  }
  for(var widthidx = 0; widthidx < width; widthidx++) {
    str += usech;
  }
  str += "\n";

  for(var heightidx = 0; heightidx < height; heightidx++) {
    picstr += str;
  }

  var arr = [];
  while(picstr.length) {
    arr.push(picstr.substring(0, interval));
    picstr = picstr.substring(interval);
  }
  picstr = "";
  var l=arr.length;
  for(var i=0; i<l; i++) {
    picstr += "<c>" + arr[i] + "</c>";
  }
  imageElem.html(picstr);
  prevstate = picstr;
}

function returnFalse() {
  return false;
}

imageElem.
    attr("unselectable", "on").
    on("contextmenu", returnFalse).
    on("selectstart", returnFalse).
    on("mousedown",   returnFalse);
