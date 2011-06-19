var nop = nop || {};

// ----------------------------------------------------------------------------------------------------------------- //
// nop.XSLT
// ----------------------------------------------------------------------------------------------------------------- //

/**
 * @constructor
 * @extends nop.XML
 */
nop.XSLT = function(o, callback) {
    this._init(o, callback);
};

nop.inherit(nop.XSLT, nop.XML);

// ----------------------------------------------------------------------------------------------------------------- //

if (typeof XSLTProcessor != 'undefined') {

    /**
     * @param  {nop.XML} xml
     * @return {nop.XML}
     */
    nop.XSLT.prototype.transform = function(xml) {
        if (!this.processor) {
            this.processor = new XSLTProcessor();
            this.processor.importStylesheet(this.get());
        }
        var out = this.processor.transformToDocument(xml.get());
        return new nop.XML(out);
    };

} else {

    /** @private */
    nop.XSLT.prototype._pid = 'threaded_dom';

    /** @inheritDoc */
    nop.XSLT.prototype.load = function(url, callback) {
        var doc = this.get() || this._empty();

        doc.onreadystatechange = function() {
            if (doc.readyState === 4) {
                if (callback) {
                    callback();
                }
            }
        }
        doc.async = !!callback;
        doc.load(url);
    };

    /**
     * @param  {nop.XML} xml
     * @return {nop.XML}
     */
    nop.XSLT.prototype.transform = function(xml) {
        if (!this.processor) {
            var template = nop.XML._getDOM('xslt');
            template.stylesheet = this.get();
            this.processor = template.createProcessor();
        }

        var out = nop.XML._getDOM('dom');
        this.processor.input = xml.get();
        this.processor.output = out;
        this.processor.transform();

        return new nop.XML(out);
    };

}

