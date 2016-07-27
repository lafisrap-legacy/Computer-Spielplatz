with(paper) {
	Raster.prototype._camanOrgImage = null;
	Raster.prototype.filter = function(options) {

		var self = this,
			ctx = this.getContext(),  // caution! This also inits this._canvas (should).
			size = this._size,
			ret = null;

		this._camanOrgImage = options.rollback || this._camanOrgImage;

		if( options.commit ) {
			delete options.commit;
			ret = this._camanOrgImage;
			this._camanOrgImage = null;
		} else if( !this._camanOrgImage ) {
			this._camanOrgImage = this.clone(false);
		} else {
			var dst = ctx.createImageData(size.width, size.height);

    		dst.data.set(this._camanOrgImage.getImageData(new Rectangle(0, 0, size.width, size.height)).data);
			this.setImageData(dst);

			if( options.rollback === null ) return;
		}

		this._canvas.removeAttribute("data-caman-id");
		delete options.rollback;

		Caman(this._canvas, function () {

			for( option in options ) {
				if( typeof this[option] === "function" ) this[option](options[option]);
			}

			this.render(function () {
				self._changed(129);
			});
		});

		return ret;
	};
}

