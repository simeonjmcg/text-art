var txtimg = {};

/**
 * Pen object
 * @param {txtimg.Point} offset
 * @param {Array.<Array.<number>>} data 2D array, with only 0s or 1s, for empty or full pen pixels.
 * @constructor
 * @struct
 */
txtimg.Pen = function(offset, data) {
  /**
   * @type {txtimg.Point}
   * @public
   */
  this.offset = offset;

  /**
   * 2D array with a 0 or 1, indicating empty or full pix.
   * Not to be confused with layer data, which contains palette info,
   * this must represent whichever palette item currently selected.
   * @type {Array.<Array.<number>>}
   * @public
   */
  this.data = data;
};

/**
 * Image layer
 * @param {txtimg.Image} owner
 * @param {number} layerfill fill color ID
 * @constructor
 * @struct
 */
txtimg.Layer = function (owner, layerfill) {
  /**
   * @type {Array.<string>}
   * @public
   */
  this.palette = owner.palette;
  
  /**
   * Character pixel data. 2D array, where each value represents 
   * palette ID numbers for every pixel.
   * @type {Array.<Array<number>>}
   * @protected
   */
  this.data = [];

  /**
   * list of available pens
   * @type {Array.<txtimg.Pen>}
   * @private
   */
  this.pens = owner.pens;

  /**
   * Current pen ID
   * @type {number}
   * @protected
   */
  this.pen = owner.pen;

  for(var y=0; y<height; y++) {
    this.data[y] = [];
    for(var x=0; x<width; w++) {
      this.data[y][x] = layerfill;
    }
  }
};

/**
 * setPixel used internally for bresenham functions
 * @param {number} x
 * @param {number} y
 * @this {txtimg.Layer}
 * @private
 */
txtimg.Layer.prototype.setPixel_ = function(x,y) {
  return this.setPixel(new txtimg.Point(x,y));
}

/**
 * public facing setPixel
 * @param {txtimg.Point}
 * @this {txtimg.Layer}
 * @public
 */
txtimg.Layer.prototype.setPixel = function(p) {
  var pen = this.pens[this.pen];
  var h = pen.data.length;
  for(var y=0; y<h; y++) {
    var w = pen.data[y].length;
    for(var x=0; x<w; x++) {
      var newx = p.x + pen.offset.x + x;
      var newy = p.y + pen.offset.y + y;

      if(pen.data[y][x] && newy >= 0 && newy < h && newx >= 0 && newx < w) {
        this.data[newy][newx] = pen.data[y][x];
      }
    }
  }
};

/**
 * draw straight line on layer.
 * @param {txtimg.Point} start
 * @param {txtimg.Point} end
 * @public
 */
txtimg.Layer.prototype.drawLine = function (start, end) {
  plotLine(this.setPixel_, start.x, start.y, end.x, end.y);
};

/**
 * draws a rectangle onto layer.
 * @param {txtimg.Point} pt1
 * @param {txtimg.Point} pt2
 * @public
 */
txtimg.Layer.prototype.drawRect = function(pt1, pt2) {
  plotLine(this.setPixel_, pt1.x, pt1.y, pt1.x, pt2.y);
  plotLine(this.setPixel_, pt1.x, pt2.y, pt2.x, pt2.y);
  plotLine(this.setPixel_, pt2.x, pt2.y, pt2.x, pt1.y);
  plotLine(this.setPixel_, pt2.x, pt1.y, pt1.x, pt1.y);
};

/**
 * draws an ellipse within a given rectangle.
 * @param {txtimg.Point} pt1
 * @param {txtimg.Point} pt2
 * @public
 */
txtimg.Layer.prototype.drawEllipse = function(pt1, pt2) {
  plotEllipseRect(this.setPixel_, pt1.x, pt1.y, pt2.x, pt2.y);
};


/**
 * Raw raster image object
 * @param {number} width
 * @param {number} height
 * @param {Array.<string>} palette
 * @param {Array.<txtimg.Pen>} pens
 * @constructor
 * @struct
 */
txtimg.Image = function (width, height, palette, pens) {
  /**
   * @type {number}
   * @public
   */
  this.width = width;
  /**
   * @type {number}
   * @public
   */
  this.height = height;
  
  /**
   * @type {Array.<txtimg.Layer>}
   * @public
   */
  this.layers = [];
  
  /**
   * @type {Array.<string>}
   * @public
   */
   this.palette = palette;
};

/**
 * @param {txtimg.Layer=} layer
 * @return {txtimg.Layer}
 * @public
 */
txtimg.Image.prototype.addLayer = function(layer) {
  this.layers.push(layer);
  return layer;
};

/**
 * @param {number} x
 * @param {number} y
 * @constructor
 * @struct
 */
txtimg.Point = function(x,y) {
  /**
   * @type {number}
   * @public
   */
  this.x = x;
  /**
   * @type {number}
   * @public
   */
  this.y = y;
};

/**
 * merge all layers in txtimg.Image
 * @return {txtimg.Layer}
 * @public
 */
txtimg.Image.prototype.mergeLayers = function() {
  var outlayer = new txtimg.Layer(this);
  var l=this.layers.length;
  for(var i=0; i<l; i++) {
    var layer = this.layers[i];
    for(var y=0; y<layer.height; y++) {
      for(var x=0; x<layer.width; x++) {
        if(layer.data[y][x] != null) {
          outlayer.data[y][x] = layer.data[y][x];
        }
      }
    }
  }
  return outlayer;
}

/**
 * output text from image object
 * @return {string}
 * @public
 */
txtimg.Image.prototype.outputText = function() {
  var output = "";
  var layer = this.mergeLayers();
  var h = layer.height;
  for(var y=0; y<h; y++) {
    var w = layer.width;
    for(var x=0; x<w; y++) {
      output += this.palette[layer.data[y][x]];
    }
    output += "\n";
  }
  return output;
};
