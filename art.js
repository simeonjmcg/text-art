var mouseDown = 0;
var lastPix;
var undo = [];
var redo = [];
var drawElipse;
var drawRect;
var width = 40;
var height = 20;
var pen = {0:[0]};
var interval = 500;
var tool = 0;
var image;
var prevstate;

image = $("#image");
$("#foreground").val("▓");
$("#background").val("░");
$("#out").val("");
$("#foreground_other").val("#");
$("#background_other").val(" ");
$("#size").val("16");
$("#filled").hide();
redraw();

$(document).keydown(function(e){
	if(e.ctrlKey) {
		if(e.keyCode == 90) {
			$("#undo").click();
		} else if(e.keyCode == 89) {
			$("#redo").click();
		}
	}
});
$("#penT td").click(function(e) {
	$("#penT td[selected]").removeAttr("selected");
	$(e.target).attr("selected", "");
	pen=JSON.parse($(e.target).attr("value"));
});

$("#toolT td").click(function(e) {
	$("#toolT td[selected]").removeAttr("selected");
	$(e.target).attr("selected", "");
	tool = parseInt($(e.target).attr("value"));
	if(tool == 2 || tool == 3) $("#filled").show();
	else $("#filled").hide();
	image.html(prevstate);
});


$("#filled").click(function(e) {
	if($("#filled").is("[selected]")) {
		$("#filled").removeAttr("selected");
	} else {
		$("#filled").attr("selected", "");
	}
});
$("#new").click(function(e) {
	var hwstr = prompt("type the size with the format of #width#x#height#, ex. 20x10.");

	var mat = hwstr.match(/^(\d+)x(\d+)$/);
	width = parseInt(mat[1]);
	height = parseInt(mat[2]);
	redraw();
});
$("#size").keydown(function (e) {
	// Allow: backspace, delete, tab, escape, enter and .
	if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
	    // Allow: Ctrl+A
	    (e.keyCode == 65 && e.ctrlKey === true) || 
		    // Allow: home, end, left, right
		    (e.keyCode >= 35 && e.keyCode <= 39)) {
			    // let it happen, don't do anything
			    return;
		    }
		    // Ensure that it is a number and stop the keypress
		    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
			    e.preventDefault();
		    }
});
$("#size").keyup(function(e){
	var num = $("#size").val();
	if(parseInt(num) > 0)	{
		$("#image").css('font-size', num + "px");
	}
});
$("#undo").click(function(e){
	if(undo.length != 0) {
		redo.push(prevstate);
		image.html(undo.pop());
		prevstate=image.html();
	}
});
$("#redo").click(function(e){
	if(redo.length != 0) {
		undo.push(prevstate);
		var popped = redo.pop();
		image.html(popped);
		prevstate=popped;
	}
});
$("#reset").click(function(e){
	if(confirm("are you sure you want to reset the board? you cannot undo this action!")) {
		undo = redo = [];
		redraw();
	}
});
$("#background").change(function(e){
	if($("#background").val() == "other") {
		$("#background_other").attr("type","text");
	} else {
		$("#background_other").attr("type","hidden");
	}
});
$("#foreground").change(function(e){
	if($("#foreground").val() == "other") {
		$("#foreground_other").attr("type","text");
	} else {
		$("#foreground_other").attr("type","hidden");
	}
});

$("#output").click(function(e){
	$("#out").attr({
		"cols": width+1,
		"rows": height+1
	})
	image.html(prevstate);
	$("#out").val(image.text());
});

function drawLine(pos1,pos2,ch) {				
	var dist = {
		x: Math.abs(pos2.x-pos1.x),
		y: Math.abs(pos2.y-pos1.y)
	};
	var sign = {
		x: pos1.x < pos2.x ? 1 : pos1.x > pos2.x ? -1 : 0,
		y: pos1.y < pos2.y ? 1 : pos1.y > pos2.y ? -1 : 0
	};
	var deltp = {x:0,y:0};

	for(var stepper = dist.x > dist.y ? dist.x : dist.y; stepper >= 0; stepper--) {
		setPix(pos1.x + deltp.x,pos1.y + deltp.y,ch);
		if(dist.x > dist.y) {
			deltp.x = stepper*sign.x;
			deltp.y = Math.round(dist.y/dist.x*stepper)*sign.y;
		} else if(dist.x < dist.y) {
			deltp.y = stepper*sign.y;
			deltp.x = Math.round(dist.x/dist.y*stepper)*sign.x;
		} else {
			deltp.x = stepper*sign.x;
			deltp.y = stepper*sign.y;
		}
	}
}
function setPix(x,y,ch) {
	for(var y_2 in pen) {
		for(var x_2 in pen[y_2]) {
			var delt_x = x+pen[y_2][x_2];
			var delt_y = y+parseInt(y_2);
			if(delt_x >= 0 && delt_y >=0 && delt_x < width && delt_y < height) {
				var blockidx = blockIdxFromXY(x+pen[y_2][x_2],y+parseInt(y_2));
				var block = $("#image c:nth-of-type("+(blockidx.block+1)+")");
				var tx = block.text();
				block.text(tx.substring(0,blockidx.i) + ch + tx.substring(blockidx.i+1));
			}
		}
	}
}
function charToX(i) {
	return i%(width+1);
}
function charToY(i) {
	return Math.floor(i/(width+1));
}
function XYtoChar(x,y){

	return (width+1)*y + x;
}
function blockIdxFromXY(x,y) {
	var char = XYtoChar(x,y);
	return {block:Math.floor(char/interval),i:char%interval};
}
function mapMouseToChar(x,y) {
	return {
		x: Math.floor(x/(image.width() /width )),
		y: Math.floor(y/(image.height()/height))
	};
	// width of element divided by string length = character width. 
	// mousepos devided by character width, rounded = character index
}


drawRect = function(pos1,pos2,ch,filled) {
	var width =  Math.abs(pos2.x - pos1.x);
	var height = Math.abs(pos2.y - pos1.y);

	var origin = {
		x:Math.min(pos1.x,pos2.x),
		y:Math.min(pos1.y,pos2.y)
	};
	if(filled) {
		for(var y=0;y<height;y++){
			for(var x=0;x<width;x++) {
				setPix(origin.x + x,origin.y + y,ch);
			}
		}
	} else {
		for(var y=0;y<=height;y++){
			setPix(origin.x,origin.y + y,ch);
			setPix(origin.x + width,origin.y + y,ch);
		}
		for(var x=0;x<width;x++){
			setPix(origin.x + x,origin.y,ch);
			setPix(origin.x + x,origin.y + height,ch);
		}
	}
}
drawElipse = function(pos1,pos2,ch,filled) {
	var width = Math.round(Math.abs(pos2.y - pos1.y)/2);
	var height = Math.round(Math.abs(pos2.x - pos1.x)/2);

	var origin = {
		x:Math.min(pos1.y,pos2.y),
		y:Math.min(pos1.x,pos2.x)
	};

	origin.x += width;
	origin.y += height;

	var hh = height * height;
	var ww = width * width;
	var hhww = hh * ww;
	var x0 = width;
	var dx = 0;

	// do the horizontal diameter
	var lastx0 = 0;
	// now do both halves at the same time, away from the diameter
	for (var y = 0; y <= height; y++) {
		var x1 = x0 - (dx - 1);  // try slopes of dx - 1 or more
		for (; x1 > 0; x1--) {
			if (x1*x1*hh + y*y*ww <= hhww) {
				break;
			}
		}
		dx = x0 - x1;  // current approximation of the slope
		x0 = x1;
		if(filled) {
			for (var x = -x0; x <= x0; x++) {
				setPix(origin.y - y,origin.x + x,ch);
				setPix(origin.y + y,origin.x + x,ch);
			}
		} else {
			setPix(origin.y - y, origin.x - x0, ch);
			setPix(origin.y + y, origin.x - x0, ch);
			setPix(origin.y - y, origin.x + x0, ch);
			setPix(origin.y + y, origin.x + x0, ch);
			if(lastx0 != 0 && Math.abs(lastx0 - x0) > 1) {
				for (var x = 0; x < Math.abs(lastx0 - x0); x++) {
					setPix((origin.y - y) + 1, origin.x - (-x + lastx0), ch);
					setPix((origin.y + y) - 1, origin.x - (-x + lastx0), ch);
					setPix((origin.y - y) + 1, origin.x + (-x + lastx0), ch);
					setPix((origin.y + y) - 1, origin.x + (-x + lastx0), ch);
				}

			}

		}
		lastx0 = x0;
	}
}

$(document).mousedown(function(e){
	if(e.button == 0) mouseDown = 1;
	else if(e.button == 2) mouseDown = 2;
});
$(document).mouseup(function(e){
	if(tool == 1) {
		if(e.button == 0 || e.button == 2){
			prevstate=image.html();
		}
	} else if(tool == 2) {
		if(e.button == 0 || e.button == 2){
			prevstate=image.html();
		}
	} else if(tool == 3) {
		if(e.button == 0 || e.button == 2){
			prevstate=image.html();
		}
	}
	mouseDown = 0;

	lastPix = undefined;
});

image.mousedown(function(e){
	e.preventDefault();
	undo.push(prevstate);
	var parentOffset = image.offset(); 
	var pval = mapMouseToChar(
		e.pageX - parentOffset.left,
		e.pageY - parentOffset.top
	);
	lastPix = {x:pval.x,y:pval.y};
	redo = [];

});
image.mousemove(function(e){
	var parentOffset = image.offset(); 
	var pval = mapMouseToChar(
		e.pageX - parentOffset.left,
		e.pageY - parentOffset.top
	);
	pix = {x:pval.x,y:pval.y};
	var usech;
	if(mouseDown == 2){
		if($("#background").val() == "other") {
			usech = $("#background_other").val().charAt(0);
		} else {
			usech = $("#background :selected").text();
		}
	} else {
		if($("#foreground").val() == "other") {
			usech = $("#foreground_other").val().charAt(0);
		} else {
			usech = $("#foreground :selected").text();
		}
	}
	if(lastPix != undefined){
		if(tool == 0) {
			if(mouseDown == 1 || mouseDown == 2){
				drawLine(lastPix,pix,usech);
				lastPix = pix;
				prevstate = image.html();
			} else {
				image.html(prevstate);
				setPix(pix.x,pix.y,usech);
			}
		} else if(tool == 1) {
			if(mouseDown == 1 || mouseDown == 2){
				image.html(prevstate);
				drawLine(lastPix,pix,usech);
			}
		} else if(tool == 2) {
			if(mouseDown == 1 || mouseDown == 2){
				image.html(prevstate);
				drawElipse(lastPix,pix,usech,$("#filled").is("[selected]"));
			}
		} else if(tool == 3) {
			if(mouseDown == 1 || mouseDown == 2){
				image.html(prevstate);
				drawRect(lastPix,pix,usech,$("#filled").is("[selected]"));
			}
		}
	}
});
function redraw() {
	var picstr = "";
	var str = "";
	var usech;
	if($("#background").val() == "other") {
		usech = $("#background_other").val().charAt(0);
	} else {
		usech = $("#background :selected").text();
	}
	for(var widthidx = 0;widthidx < width; widthidx++) {
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
	for(var i in arr) {
		picstr += "<c>" + arr[i] + "</c>";
	}
	image.html(picstr);
	prevstate=picstr;
}
