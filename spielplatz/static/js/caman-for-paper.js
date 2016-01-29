with(paper) {
	Raster.prototype._camanOrgImage = null;
	Raster.prototype.filter = function(options) {

		var self = this,
			ctx = this.getContext(),  // caution! This also inits this._canvas (should).
			size = this._size;

		if( !this._camanOrgImage ) {
			this._camanOrgImage = this.clone(false);
		} else if( !options.commit ) {
			var dst = ctx.createImageData(size.width, size.height);

    		dst.data.set(this._camanOrgImage.getImageData(new Rectangle(0, 0, size.width, size.height)).data);
			this.setImageData(dst);

			if( options.rollback ) return;
		} else {
			this._camanOrgImage = null;
			return;
		}

		this._canvas.removeAttribute("data-caman-id");
		Caman(this._canvas, function () {

			for( option in options ) {
				this[option](options[option]);
			}

			this.render(function () {
				self._changed(129);
			});
		});
	};
}

