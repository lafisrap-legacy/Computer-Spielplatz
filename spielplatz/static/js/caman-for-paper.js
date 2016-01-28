with(paper) {
	Raster.prototype._camanImageData = null;
	Raster.prototype.filter = function(options) {

		var self = this,
			ctx = this.getContext(),  // caution! This also inits this._canvas (should).
			size = this._size;

		if( !this._camanOrgImage ) {
			this._camanOrgImage = this.clone(false);
		} else {
			var dst = ctx.createImageData(size.width, size.height);

    		dst.data.set(this._camanOrgImage.getImageData(new Rectangle(0, 0, size.width, size.height)).data);
			this.setImageData(dst);
		}

		this._canvas.removeAttribute("data-caman-id");
		Caman(this._canvas, function () {

			for( option in options ) {
				var value = options[option];
				switch( option ) {
				case "rollback":
					if( value ) this.setImageData(this._camanImageData);
					// fallthrough
				case "commit": 
					if( value ) this._camanImageData = null;
					break;
				default:
					this[option](value);
					break;
				}
			}

			this.render(function () {
				self._changed(129);
			});
		});
	};
}

